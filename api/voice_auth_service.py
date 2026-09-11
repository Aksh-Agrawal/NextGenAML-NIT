"""Voice confirmation orchestration for high-risk UPI simulator payments."""

from __future__ import annotations

import html
import threading
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from loguru import logger

from api.sarvam_client import SarvamClient

VoiceDecision = Literal["confirmed", "denied", "unclear", "no_answer"]


@dataclass
class VoiceConfirmation:
    confirmation_id: str
    transaction_id: str
    transaction: dict
    tx_risk: dict
    customer_name: str
    customer_phone: str
    status: str = "pending"
    attempts: int = 0
    call_sid: str | None = None
    prompt: str = ""
    transcript: list[dict] = field(default_factory=list)
    notes: str = ""
    outcome: str | None = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    next_retry_at: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


class VoiceAuthService:
    """Holds risky transactions and resolves them from call responses."""

    def __init__(self, settings, simulator_service):
        self.settings = settings
        self.simulator = simulator_service
        self.sarvam = SarvamClient(
            settings.SARVAM_API_KEY,
            settings.SARVAM_TTS_MODEL,
            settings.SARVAM_STT_MODEL,
        )
        self._pending: dict[str, VoiceConfirmation] = {}
        self._by_call_sid: dict[str, str] = {}
        self._lock = threading.Lock()

    def hold_transaction(self, tx: dict, tx_risk: dict) -> VoiceConfirmation:
        sender = str(tx["sender"]).upper()
        account = self.simulator.wallet.get(sender)
        confirmation_id = f"VC-{uuid.uuid4().hex[:10].upper()}"
        customer_name = account.name if account else sender
        customer_phone = account.mobile if account else ""
        prompt = self.sarvam.build_verification_prompt(
            customer_name=customer_name,
            amount=float(tx["amount"]),
            receiver=str(tx["receiver"]),
            transaction_id=str(tx["transaction_id"]),
            risk_score=float(tx_risk["score"]),
        )
        confirmation = VoiceConfirmation(
            confirmation_id=confirmation_id,
            transaction_id=str(tx["transaction_id"]),
            transaction=dict(tx),
            tx_risk=dict(tx_risk),
            customer_name=customer_name,
            customer_phone=customer_phone,
            prompt=prompt,
            notes="Transaction held. Awaiting AI voice confirmation.",
        )
        with self._lock:
            self._pending[confirmation_id] = confirmation
        self.initiate_call(confirmation_id)
        return confirmation

    def list_pending(self) -> list[dict]:
        with self._lock:
            items = [item.to_dict() for item in self._pending.values()]
        return sorted(items, key=lambda item: item["created_at"], reverse=True)

    def get(self, confirmation_id: str) -> dict | None:
        with self._lock:
            item = self._pending.get(confirmation_id)
            return item.to_dict() if item else None

    def stats(self) -> dict:
        with self._lock:
            items = list(self._pending.values())
        return {
            "total": len(items),
            "pending": sum(1 for item in items if item.status in {"pending", "calling", "no_answer"}),
            "confirmed": sum(1 for item in items if item.outcome == "confirmed"),
            "denied": sum(1 for item in items if item.outcome == "denied"),
            "no_answer": sum(1 for item in items if item.status == "no_answer"),
        }

    def initiate_call(self, confirmation_id: str) -> dict:
        with self._lock:
            confirmation = self._pending.get(confirmation_id)
            if not confirmation:
                raise KeyError(confirmation_id)
            confirmation.attempts += 1
            confirmation.status = "calling"
            confirmation.updated_at = datetime.now(timezone.utc).isoformat()

        print(f"call initated to {confirmation.customer_phone}")

        if self.settings.VOICE_AUTH_MOCK_MODE or not self._twilio_configured():
            call_sid = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
            with self._lock:
                confirmation.call_sid = call_sid
                confirmation.notes = (
                    "Mock voice call queued. Use the simulator call UI or /voice/confirm "
                    "to approve or withdraw this transaction."
                )
                self._by_call_sid[call_sid] = confirmation_id
            return confirmation.to_dict()

        try:
            from twilio.rest import Client
        except ImportError as exc:
            logger.warning(f"Twilio SDK missing, leaving call in mock-like pending state: {exc}")
            return confirmation.to_dict()

        client = Client(self.settings.TWILIO_ACCOUNT_SID, self.settings.TWILIO_AUTH_TOKEN)
        base = self.settings.TWILIO_PUBLIC_BASE_URL.rstrip("/")
        call = client.calls.create(
            to=confirmation.customer_phone,
            from_=self.settings.TWILIO_PHONE_NUMBER,
            url=f"{base}/voice/twiml/{confirmation_id}",
            status_callback=f"{base}/voice/twilio/status/{confirmation_id}",
            status_callback_event=["initiated", "ringing", "answered", "completed"],
            status_callback_method="POST",
        )
        with self._lock:
            confirmation.call_sid = call.sid
            confirmation.notes = f"Twilio call {call.sid} queued for verification."
            self._by_call_sid[call.sid] = confirmation_id
        return confirmation.to_dict()

    def twiml_for(self, confirmation_id: str) -> str:
        confirmation = self._lookup_or_raise(confirmation_id)
        action = f"/voice/twilio/gather/{confirmation_id}"
        prompt = html.escape(confirmation.prompt)
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            f'<Gather input="speech dtmf" numDigits="1" timeout="8" speechTimeout="auto" action="{action}" method="POST">'
            f'<Say language="en-IN" voice="alice">{prompt}</Say>'
            "</Gather>"
            '<Say language="en-IN" voice="alice">We did not receive your response. We will call again after five minutes.</Say>'
            "</Response>"
        )

    def process_spoken_response(self, confirmation_id: str, *, speech: str = "", digits: str = "") -> dict:
        text = (speech or digits or "").strip()
        decision = self._classify_response(text, digits)
        return self.resolve(confirmation_id, decision=decision, transcript=text)

    def register_call_status(self, confirmation_id: str, status: str) -> dict:
        confirmation = self._lookup_or_raise(confirmation_id)
        normalized = status.lower().replace("-", "_")
        if normalized in {"no_answer", "busy", "failed", "canceled"}:
            with self._lock:
                confirmation.status = "no_answer"
                confirmation.notes = "No answer. A retry has been scheduled after five minutes."
                retry_at = datetime.now(timezone.utc) + timedelta(seconds=self.settings.VOICE_AUTH_RETRY_SECONDS)
                confirmation.next_retry_at = retry_at.isoformat()
                confirmation.updated_at = datetime.now(timezone.utc).isoformat()
            timer = threading.Timer(
                self.settings.VOICE_AUTH_RETRY_SECONDS,
                lambda: self._retry_if_still_pending(confirmation_id),
            )
            timer.daemon = True
            timer.start()
        elif normalized in {"answered", "in_progress"}:
            with self._lock:
                confirmation.status = "in_progress"
                confirmation.updated_at = datetime.now(timezone.utc).isoformat()
        elif normalized == "completed" and confirmation.outcome is None:
            with self._lock:
                confirmation.status = "awaiting_response"
                confirmation.updated_at = datetime.now(timezone.utc).isoformat()
        return confirmation.to_dict()

    def resolve(
        self,
        confirmation_id: str,
        *,
        decision: VoiceDecision,
        transcript: str = "",
        analyst_notes: str = "",
    ) -> dict:
        confirmation = self._lookup_or_raise(confirmation_id)
        if transcript:
            confirmation.transcript.append({
                "speaker": "customer",
                "text": transcript,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        if decision in {"unclear", "no_answer"}:
            return self.register_call_status(confirmation_id, "no-answer")

        with self._lock:
            confirmation.outcome = decision
            confirmation.status = decision
            confirmation.notes = analyst_notes or (
                "Customer confirmed the transaction by voice."
                if decision == "confirmed"
                else "Customer denied the transaction by voice. Payment withdrawn."
            )
            confirmation.updated_at = datetime.now(timezone.utc).isoformat()

        return self.simulator.finalize_voice_confirmation(
            confirmation.to_dict(),
            approved=decision == "confirmed",
        )

    def _lookup_or_raise(self, confirmation_id: str) -> VoiceConfirmation:
        with self._lock:
            confirmation = self._pending.get(confirmation_id)
        if not confirmation:
            raise KeyError(confirmation_id)
        return confirmation

    def _retry_if_still_pending(self, confirmation_id: str) -> None:
        with self._lock:
            confirmation = self._pending.get(confirmation_id)
            should_retry = bool(confirmation and confirmation.outcome is None and confirmation.status == "no_answer")
        if should_retry:
            try:
                self.initiate_call(confirmation_id)
            except Exception as exc:
                logger.warning(f"Voice confirmation retry failed for {confirmation_id}: {exc}")

    def _twilio_configured(self) -> bool:
        return all(
            [
                self.settings.TWILIO_ACCOUNT_SID,
                self.settings.TWILIO_AUTH_TOKEN,
                self.settings.TWILIO_PHONE_NUMBER,
                self.settings.TWILIO_PUBLIC_BASE_URL,
            ]
        )

    @staticmethod
    def _classify_response(text: str, digits: str = "") -> VoiceDecision:
        normalized = text.lower().strip()
        if digits == "1":
            return "confirmed"
        if digits == "2":
            return "denied"
        yes_words = ("yes", "confirm", "continue", "proceed", "valid", "haan", "han", "ha", "हां")
        no_words = ("no", "deny", "block", "hold", "withdraw", "fraud", "nahi", "nahin", "नहीं")
        if any(word in normalized for word in yes_words):
            return "confirmed"
        if any(word in normalized for word in no_words):
            return "denied"
        return "unclear"

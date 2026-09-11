"""Small Sarvam API wrapper used by the voice authentication flow."""

from __future__ import annotations

import base64
from typing import Any

import httpx


class SarvamClient:
    """Wrap Sarvam TTS/STT calls without making the rest of the app depend on them."""

    TTS_URL = "https://api.sarvam.ai/text-to-speech"
    STT_URL = "https://api.sarvam.ai/speech-to-text"

    def __init__(self, api_key: str, tts_model: str, stt_model: str):
        self.api_key = api_key
        self.tts_model = tts_model
        self.stt_model = stt_model

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def build_verification_prompt(
        self,
        *,
        customer_name: str,
        amount: float,
        receiver: str,
        transaction_id: str,
        risk_score: float,
    ) -> str:
        amount_text = f"Rs {amount:,.0f}"
        return (
            f"Namaste {customer_name}. This is NextGen Bank's AI verification assistant. "
            f"A UPI transaction of {amount_text} to {receiver} has reached a "
            f"{risk_score:.1f} percent fraud-risk threshold. "
            "If this is your transaction and you want to continue, say yes or press 1. "
            "If this is not yours or you want to hold it, say no or press 2. "
            f"You can also ask a question about transaction {transaction_id} before deciding."
        )

    async def text_to_speech(self, text: str, language_code: str = "hi-IN") -> bytes:
        if not self.configured:
            raise RuntimeError("SARVAM_API_KEY is not configured")
        payload: dict[str, Any] = {
            "inputs": [text],
            "target_language_code": language_code,
            "model": self.tts_model,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                self.TTS_URL,
                headers={"api-subscription-key": self.api_key},
                json=payload,
            )
            response.raise_for_status()
        body = response.json()
        audio = body.get("audios", [None])[0]
        if not audio:
            raise RuntimeError("Sarvam TTS response did not contain audio")
        return base64.b64decode(audio)

    async def speech_to_text(self, audio: bytes, language_code: str = "unknown") -> str:
        if not self.configured:
            raise RuntimeError("SARVAM_API_KEY is not configured")
        files = {"file": ("speech.wav", audio, "audio/wav")}
        data = {"language_code": language_code, "model": self.stt_model}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                self.STT_URL,
                headers={"api-subscription-key": self.api_key},
                files=files,
                data=data,
            )
            response.raise_for_status()
        return str(response.json().get("transcript", "")).strip()

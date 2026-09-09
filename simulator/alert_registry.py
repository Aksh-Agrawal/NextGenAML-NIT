"""
Live alert registry for the transaction simulator.

Independent of the existing ``/alert`` endpoint: holds in-memory alerts,
optionally persists them to a JSONL ledger, and exposes a list/count API.
"""

from __future__ import annotations
import threading
import uuid
from datetime import datetime, timezone
from typing import Optional

from simulator.ledger import JsonlLedger


class AlertRegistry:
    """In-memory ring buffer of simulator alerts (newest first)."""

    def __init__(self, ledger: Optional[JsonlLedger] = None, max_alerts: int = 500):
        self._alerts: list[dict] = []
        self._lock = threading.Lock()
        self._max = max_alerts
        self._ledger = ledger

    def create(
        self,
        *,
        transaction_id: str,
        sender: str,
        receiver: str,
        amount: float,
        severity: str,
        reason: str,
    ) -> dict:
        alert = {
            "id": f"ALERT-{uuid.uuid4().hex[:8].upper()}",
            "transaction_id": transaction_id,
            "sender": sender,
            "receiver": receiver,
            "amount": round(float(amount), 2),
            "severity": severity,
            "reason": reason,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        with self._lock:
            self._alerts.insert(0, alert)
            if len(self._alerts) > self._max:
                self._alerts = self._alerts[: self._max]
        if self._ledger is not None:
            self._ledger.append(alert)
        return alert

    def list(self, limit: int | None = None) -> list[dict]:
        with self._lock:
            alerts = list(self._alerts)
        if limit is not None:
            alerts = alerts[:limit]
        return alerts

    def count(self) -> int:
        with self._lock:
            return len(self._alerts)

    def clear(self) -> None:
        with self._lock:
            self._alerts.clear()

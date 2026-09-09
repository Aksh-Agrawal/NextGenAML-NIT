"""
Append-only JSONL ledger for simulator transactions and alerts.

Writes are serialized with a lock. Never touches the existing CSV upload flow.
"""

from __future__ import annotations
import json
import threading
from pathlib import Path


class JsonlLedger:
    """Thread-safe append-only JSONL store."""

    def __init__(self, path: Path):
        self._path = path
        self._lock = threading.Lock()
        self._path.parent.mkdir(parents=True, exist_ok=True)

    @property
    def path(self) -> Path:
        return self._path

    def append(self, record: dict) -> None:
        line = json.dumps(record, default=str) + "\n"
        with self._lock:
            with self._path.open("a", encoding="utf-8") as f:
                f.write(line)

    def read_all(self) -> list[dict]:
        if not self._path.exists():
            return []
        with self._lock:
            with self._path.open("r", encoding="utf-8") as f:
                return [json.loads(line) for line in f if line.strip()]

"""
Rate-limited streaming engine for the UPI simulator.

Runs a single asyncio task that generates transactions at a chosen TPS,
pushing each through the exact same pipeline as a manual payment. Supports
start / pause / resume / stop and named fraud presets. Cancel-safe.
"""

from __future__ import annotations
import asyncio
import random
from typing import Iterator

from simulator.presets import PRESET_REGISTRY, build_generator

VALID_TPS = (1, 5, 10, 50, 100)

REMARKS = ["Dinner", "Rent", "Salary", "Lending", "Shopping", "Bill Payment",
           "Groceries", "Recharge", "Utility"]
LOCATIONS = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai"]


def build_random_generator(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Infinite stream of plausible UPI payments between the dummy accounts."""
    while True:
        sender, receiver = rng.sample(accounts, 2)
        amount = rng.choice([250, 500, 1_000, 2_000, 2_500, 5_000, 8_000,
                             9_900, 15_000, 45_000, 95_000, 150_000])
        yield {
            "sender": sender,
            "receiver": receiver,
            "amount": amount,
            "remark": rng.choice(REMARKS),
            "device_id": f"DEV-{rng.randint(1000, 9999)}",
            "ip": f"10.{rng.randint(0, 20)}.{rng.randint(0, 255)}.{rng.randint(1, 254)}",
            "location": rng.choice(LOCATIONS),
            "channel": "UPI",
            "transaction_type": "transfer",
        }


class StreamEngine:
    """Owns the asyncio streaming task and its lifecycle state."""

    def __init__(self, service, executor):
        self.service = service
        self._executor = executor
        self._task: asyncio.Task | None = None
        self._pause = asyncio.Event()
        self._pause.set()
        self._state = "idle"  # idle | running | paused | completed
        self._tps = 5
        self._preset: str | None = None
        self._generator: Iterator[dict] | None = None
        self._rng = random.Random()
        self._count = 0

    # ── Introspection ──────────────────────────────────
    @property
    def state(self) -> str:
        return self._state

    @property
    def tps(self) -> int:
        return self._tps

    @property
    def preset(self) -> str | None:
        return self._preset

    @property
    def count(self) -> int:
        return self._count

    def status(self) -> dict:
        return {
            "state": self._state,
            "tps": self._tps,
            "preset": self._preset,
            "processed": self._count,
        }

    # ── Controls ───────────────────────────────────────
    def dispatch(self, action: str, tps: int = 5, preset: str | None = None) -> dict:
        action = (action or "").strip().lower()
        if action == "start":
            return self.start(tps=tps, preset=preset)
        if action == "pause":
            return self.pause()
        if action == "resume":
            return self.resume()
        if action == "stop":
            return self.stop()
        return {"status": "error", "detail": f"Unknown action: {action}"}

    def start(self, tps: int = 5, preset: str | None = None) -> dict:
        if tps not in VALID_TPS:
            return {"status": "error", "detail": f"tps must be one of {VALID_TPS}"}
        if preset and preset not in PRESET_REGISTRY:
            return {"status": "error", "detail": f"Unknown preset: {preset}"}

        if self._task is not None and not self._task.done():
            self._tps = tps
            self._preset = preset
            if self._state == "paused":
                self.resume()
            return {"state": self._state, "tps": self._tps,
                    "preset": self._preset, "processed": self._count,
                    "message": "already running"}

        self._tps = tps
        self._preset = preset
        self._state = "running"
        self._pause.set()
        self._count = 0
        self._rng = random.Random()
        self._generator = build_generator(preset, self.service.wallet.ids(), self._rng)
        self._task = asyncio.get_running_loop().create_task(self._run())
        return {"state": "running", "tps": tps, "preset": preset, "processed": 0}

    def pause(self) -> dict:
        if self._state == "running":
            self._pause.clear()
            self._state = "paused"
        return {"state": self._state, "tps": self._tps,
                "preset": self._preset, "processed": self._count}

    def resume(self) -> dict:
        if self._state == "paused":
            self._pause.set()
            self._state = "running"
        return {"state": self._state, "tps": self._tps,
                "preset": self._preset, "processed": self._count}

    def stop(self) -> dict:
        task = self._task
        self._task = None
        self._state = "idle"
        self._generator = None
        if task is not None and not task.done():
            task.cancel()
        return {"state": "stopped", "tps": self._tps,
                "preset": self._preset, "processed": self._count}

    # ── Background loop ────────────────────────────────
    async def _run(self) -> None:
        loop = asyncio.get_running_loop()
        interval = 1.0 / max(int(self._tps), 1)
        try:
            while True:
                await self._pause.wait()
                if self._generator is None:
                    self._generator = build_random_generator(
                        self.service.wallet.ids(), self._rng)
                tx = next(self._generator, None)
                if tx is None:
                    self._state = "completed"
                    return
                envelope = await loop.run_in_executor(
                    self._executor, self.service.process_transaction, tx)
                self._count += 1
                await self.service.broadcast(envelope)
                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            raise
        finally:
            self._task = None

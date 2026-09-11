"""
Dummy UPI accounts registry + in-memory wallet for the transaction simulator.

Accounts live only in memory (no DB). Wallet balances are debited / credited
atomically; a payment that would overdraft is rejected by ``debit``.
"""

from __future__ import annotations
import threading
import time
from dataclasses import dataclass

# (account_id, name, mobile, upi_id, balance, base_risk)
SEED_ACCOUNTS_DATA = [
    ("RAHUL", "Rahul", "9876543210", "rahul@demo", 75_000, 0.15),
    ("PRIYA", "Priya", "9876543211", "priya@demo", 62_000, 0.12),
    ("AKASH", "Akash", "9876543212", "akash@demo", 120_000, 0.20),
    ("NEHA", "Neha", "9876543213", "neha@demo", 48_500, 0.10),
    ("AMAN", "Aman", "9876543214", "aman@demo", 90_000, 0.25),
    ("RIYA", "Riya", "9876543215", "riya@demo", 33_000, 0.10),
    ("VIKAS", "Vikas", "9876543216", "vikas@demo", 210_000, 0.30),
    ("SONIA", "Sonia", "9876543217", "sonia@demo", 56_750, 0.15),
    ("JAY", "Jay", "+917647988651", "jay@demo", 110_000_000_000, 78),
    ("AKSH", "Aksh", "+917647988651", "aksh@demo", 150_000_000, 76),
    ("PRATYUSH", "Pratyush", "+919876543220", "pratyush@demo", 95_000, 0.14),
]

CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai"]


@dataclass
class UPIAccount:
    """Static metadata for a dummy UPI user."""

    account_id: str
    name: str
    mobile: str
    upi_id: str
    balance: float
    base_risk: float
    channel: str = "UPI"
    city: str = "Mumbai"
    avatar_color: str = "#00e5ff"


def build_seed_accounts() -> list[UPIAccount]:
    """Create the seed account objects with deterministic avatar colors."""
    accounts = []
    palette = ["#00e5ff", "#8b5cf6", "#22c55e", "#ffaa00",
               "#ff3d71", "#4d8eff", "#14b8a6", "#f472b6",
               "#38bdf8", "#a3e635", "#fb7185"]
    for i, (acc_id, name, mobile, upi_id, balance, risk) in enumerate(SEED_ACCOUNTS_DATA):
        accounts.append(
            UPIAccount(
                account_id=acc_id,
                name=name,
                mobile=mobile,
                upi_id=upi_id,
                balance=balance,
                base_risk=risk,
                city=CITIES[i % len(CITIES)],
                avatar_color=palette[i % len(palette)],
            )
        )
    return accounts


class WalletStore:
    """
    In-memory wallet ledger.

    Thread-safe via a single lock. Tracks balances plus a bounded per-account
    history used for transaction-level risk signals (repeated receiver,
    fan-in/out, layering, shared device/IP, geo anomaly).
    """

    def __init__(self, accounts: list[UPIAccount]):
        self._accounts = {a.account_id: a for a in accounts}
        self._balance = {a.account_id: float(a.balance) for a in accounts}
        self._by_mobile = {a.mobile: a for a in accounts}
        self._by_upi = {a.upi_id.lower(): a for a in accounts}
        self._history: dict[str, list[dict]] = {a.account_id: [] for a in accounts}
        self._lock = threading.Lock()

    # ── Lookup / resolution ────────────────────────────
    def resolve(self, *, account_id=None, mobile=None, upi_id=None) -> str | None:
        """Resolve an account_id / mobile / upi_id to an account_id."""
        if account_id is not None:
            acc = self._accounts.get(str(account_id).upper())
            return acc.account_id if acc else None
        if mobile is not None:
            acc = self._by_mobile.get(str(mobile))
            return acc.account_id if acc else None
        if upi_id is not None:
            acc = self._by_upi.get(str(upi_id).lower())
            return acc.account_id if acc else None
        return None

    def ids(self) -> list[str]:
        return list(self._accounts.keys())

    def get(self, account_id: str) -> UPIAccount | None:
        return self._accounts.get(str(account_id).upper())

    def get_balance(self, account_id: str) -> float:
        with self._lock:
            return self._balance.get(str(account_id).upper(), 0.0)

    def list_accounts(self) -> list[dict]:
        """Serializable account list with the current live balances."""
        result = []
        for acc in self._accounts.values():
            result.append({
                "account_id": acc.account_id,
                "name": acc.name,
                "mobile": acc.mobile,
                "upi_id": acc.upi_id,
                "balance": round(self.get_balance(acc.account_id), 2),
                "risk_score": round(acc.base_risk * 100, 1),
                "channel": acc.channel,
                "city": acc.city,
                "avatar_color": acc.avatar_color,
            })
        return result

    # ── Settlement ──────────────────────────────────────
    def debit(self, account_id: str, amount: float) -> bool:
        """Atomically debit an account. Returns False if it would overdraft."""
        acc = str(account_id).upper()
        with self._lock:
            bal = self._balance.get(acc, 0.0)
            if bal < amount:
                return False
            self._balance[acc] = bal - amount
            return True

    def credit(self, account_id: str, amount: float) -> None:
        acc = str(account_id).upper()
        with self._lock:
            self._balance[acc] = self._balance.get(acc, 0.0) + amount

    # ── History (for risk signals) ──────────────────────
    def record(self, tx: dict) -> None:
        """Record a settled transaction in the per-account history."""
        now = time.time()
        sender = str(tx["sender"]).upper()
        receiver = str(tx["receiver"]).upper()
        amount = float(tx["amount"])
        with self._lock:
            for acc, peer, direction in (
                (sender, receiver, "out"),
                (receiver, sender, "in"),
            ):
                hist = self._history.get(acc, [])
                hist.append({
                    "peer": peer,
                    "direction": direction,
                    "amount": amount,
                    "ts": now,
                    "device_id": tx.get("device_id", ""),
                    "ip": tx.get("ip", ""),
                    "location": tx.get("location", ""),
                })
                if len(hist) > 2000:
                    del hist[: len(hist) - 2000]

    def count_between(self, sender: str, receiver: str, window_seconds: float | None = None) -> int:
        """Count settled transfers sender -> receiver, optionally in a window."""
        sender = str(sender).upper()
        receiver = str(receiver).upper()
        with self._lock:
            entries = [
                e for e in self._history.get(sender, [])
                if e["peer"] == receiver and e["direction"] == "out"
            ]
        if window_seconds is not None:
            cutoff = time.time() - window_seconds
            entries = [e for e in entries if e["ts"] >= cutoff]
        return len(entries)

    def recent_txns(self, account_id: str, window_seconds: float) -> list[dict]:
        """All history entries for an account within a time window."""
        acc = str(account_id).upper()
        cutoff = time.time() - window_seconds
        with self._lock:
            return [e for e in self._history.get(acc, []) if e["ts"] >= cutoff]

    def distinct_accounts_for(self, key: str, value: str) -> int:
        """Count distinct accounts that ever used the same device_id / ip."""
        if not value:
            return 0
        with self._lock:
            accounts = set()
            for acc, hist in self._history.items():
                if any(e.get(key) == value for e in hist):
                    accounts.add(acc)
            return len(accounts)

    def typical_locations(self, account_id: str) -> set[str]:
        """Recent locations an account has transacted from."""
        acc = str(account_id).upper()
        with self._lock:
            recent = [e.get("location") for e in self._history.get(acc, [])[-5:] if e.get("location")]
        return set(recent)

"""
Fraud / behavior scenario presets for the transaction simulator.

Each preset is a small generator function producing a finite sequence of
transaction dicts that flow through the exact same pipeline as a manual pay.
All presets are idempotent at the stream-engine level (start / pause /
resume / stop are handled there).
"""

from __future__ import annotations
import random
from typing import Iterator

REMARKS = ["Dinner", "Rent", "Salary", "Lending", "Shopping", "Invoice",
           "Bill Payment", "Groceries", "Recharge", "Utility", "Cash Withdrawal"]


def _base(sender: str, receiver: str, amount, remark="Transfer",
          rng: random.Random = None) -> dict:
    rng = rng or random
    return {
        "sender": sender,
        "receiver": receiver,
        "amount": int(amount),
        "remark": remark,
        "device_id": f"DEV-{rng.randint(1000, 9999)}",
        "ip": f"10.{rng.randint(0, 20)}.{rng.randint(0, 255)}.{rng.randint(1, 254)}",
        "location": rng.choice(["Mumbai", "Delhi", "Bengaluru", "Pune",
                                "Hyderabad", "Chennai"]),
        "channel": "UPI",
        "transaction_type": "transfer",
    }


def _money_laundering(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Large layering chain with near-parallel movements A->B->C->D."""
    a, b, c, d = accounts[:4]
    for _ in range(4):
        yield _base(a, b, rng.randint(180_000, 250_000), "Invoice", rng)
        yield _base(b, c, rng.randint(175_000, 245_000), "Payment", rng)
        yield _base(c, d, rng.randint(170_000, 240_000), "Transfer", rng)


def _structuring(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Sub-threshold cluster just below the ₹10K reporting threshold."""
    s, r = accounts[0], accounts[1]
    for _ in range(8):
        yield _base(s, r, rng.randint(9_800, 9_999), "Utility", rng)


def _layering(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Multi-hop layering through mule accounts, decreasing amounts."""
    a, b, c, d, e = accounts[:5]
    for _ in range(3):
        yield _base(a, b, rng.randint(120_000, 180_000), "Invoice", rng)
        yield _base(b, c, rng.randint(110_000, 170_000), "Payment", rng)
        yield _base(c, d, rng.randint(100_000, 160_000), "Settlement", rng)
        yield _base(d, e, rng.randint(90_000, 150_000), "Transfer", rng)


def _circular_flow(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Closed loop A->B->C->A, repeated."""
    a, b, c = accounts[:3]
    for _ in range(3):
        yield _base(a, b, rng.randint(50_000, 90_000), "Lending", rng)
        yield _base(b, c, rng.randint(50_000, 90_000), "Lending", rng)
        yield _base(c, a, rng.randint(50_000, 90_000), "Settlement", rng)


def _rapid_transfers(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Many rapid transfers between the same pair."""
    a, b = accounts[0], accounts[1]
    for _ in range(12):
        yield _base(a, b, rng.choice([5_000, 10_000, 20_000]), "Lending", rng)


def _normal_user(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Everyday small peer-to-peer payments."""
    for _ in range(10):
        s, r = rng.sample(accounts, 2)
        yield _base(s, r, rng.choice([200, 500, 750, 1_000, 1_500]),
                    rng.choice(["Dinner", "Groceries", "Recharge"]), rng)


def _business_payments(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Regular B2B vendor payments."""
    a, b = accounts[0], accounts[1]
    for _ in range(5):
        yield _base(a, b, rng.choice([50_000, 75_000, 100_000]),
                    "Invoice Payment", rng)


def _salary_payments(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Employer pays a batch of salaries."""
    employer = "VIKAS" if "VIKAS" in accounts else accounts[0]
    for emp in [a for a in accounts if a != employer][:4]:
        yield _base(employer, emp, 45_000, "Salary", rng)


def _cash_withdrawal(accounts: list[str], rng: random.Random) -> Iterator[dict]:
    """Repeated near-threshold cash-style withdrawals."""
    s, r = accounts[2], accounts[3]
    for _ in range(6):
        yield _base(s, r, rng.choice([48_000, 49_000, 98_000, 99_000]),
                    "Cash Withdrawal", rng)


PRESET_REGISTRY: dict[str, object] = {
    "money_laundering": _money_laundering,
    "structuring": _structuring,
    "layering": _layering,
    "circular_flow": _circular_flow,
    "rapid_transfers": _rapid_transfers,
    "normal_user": _normal_user,
    "business_payments": _business_payments,
    "salary_payments": _salary_payments,
    "cash_withdrawal": _cash_withdrawal,
}

PRESET_NAMES = sorted(PRESET_REGISTRY.keys())
PRESET_LABELS = {
    "money_laundering": "Money Laundering",
    "structuring": "Structuring",
    "layering": "Layering",
    "circular_flow": "Circular Flow",
    "rapid_transfers": "Rapid Transfers",
    "normal_user": "Normal User",
    "business_payments": "Business Payments",
    "salary_payments": "Salary Payments",
    "cash_withdrawal": "Cash-Withdrawal Pattern",
}


def build_generator(name: str | None, accounts: list[str],
                    rng: random.Random) -> Iterator[dict] | None:
    """Return a generator for a named preset, or None for random streaming."""
    if not name:
        return None
    factory = PRESET_REGISTRY.get(name)
    if factory is None:
        return None
    return factory(accounts, rng)

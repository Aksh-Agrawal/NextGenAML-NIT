"""Timeline endpoint – investigation timeline for an account."""

from fastapi import APIRouter
from api.schemas import TimelineEvent

router = APIRouter(tags=["Timeline"])


@router.get("/timeline/{account_id}", response_model=list[TimelineEvent])
def get_timeline(account_id: str):
    """Reconstruct the transaction timeline for an account."""
    from api.main import graph_manager

    df = graph_manager.get_dataframe()
    if df is None:
        return []

    txns = df[
        (df["sender_account"] == account_id) | (df["receiver_account"] == account_id)
    ].sort_values("timestamp")

    events = []
    for i, (_, row) in enumerate(txns.iterrows()):
        is_sender = row["sender_account"] == account_id
        is_suspicious = row.get("label", 0) == 1

        if is_sender:
            title = f"Outgoing Transfer to {row['receiver_account']}"
            evt_type = "flow"
        else:
            title = f"Incoming Transfer from {row['sender_account']}"
            evt_type = "origin"

        if is_suspicious:
            status = "alert" if row["amount"] < 1_000_000 else "critical"
        else:
            status = "verified"

        events.append(
            TimelineEvent(
                id=i + 1,
                time=row["timestamp"].strftime("%I:%M %p"),
                date=row["timestamp"].strftime("%b %d, %Y"),
                type=evt_type,
                title=title,
                description=f"₹{row['amount']:,.2f} {row.get('currency', 'INR')} – {row.get('transaction_type', 'transfer')}",
                location="Internal Ledger",
                status=status,
                amount=float(row["amount"]),
            )
        )

    return events

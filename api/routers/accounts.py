"""Account endpoints – list, search, detail, risk scores."""

from fastapi import APIRouter, Query
from api.schemas import AccountRisk

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("/", response_model=list[AccountRisk])
def list_accounts(
    min_risk: float = Query(0, ge=0, le=100),
    max_risk: float = Query(100, ge=0, le=100),
    pattern: str | None = None,
    status: str | None = None,
    search: str | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List accounts with optional risk / pattern / status filters."""
    from api.main import risk_engine

    all_scores = risk_engine.score_all()

    # Filter
    filtered = [
        s for s in all_scores
        if min_risk <= s["risk_score"] <= max_risk
    ]
    if pattern:
        filtered = [s for s in filtered if pattern.lower() in s["pattern_detected"].lower()]
    if status:
        filtered = [s for s in filtered if s["status"].lower() == status.lower()]
    if search:
        q = search.lower()
        filtered = [
            s for s in filtered
            if q in s["account_id"].lower() or q in s["pattern_detected"].lower()
        ]

    # Sort by risk descending
    filtered.sort(key=lambda x: x["risk_score"], reverse=True)

    total = len(filtered)
    page = filtered[offset: offset + limit]

    return page


@router.get("/count")
def account_count():
    from api.main import risk_engine

    all_scores = risk_engine.score_all()
    return {
        "total": len(all_scores),
        "critical": sum(1 for s in all_scores if s["status"] == "Critical"),
        "flagged": sum(1 for s in all_scores if s["status"] == "Flagged"),
        "under_review": sum(1 for s in all_scores if s["status"] == "Under Review"),
        "verified": sum(1 for s in all_scores if s["status"] == "Verified"),
    }


@router.get("/{account_id}", response_model=AccountRisk)
def get_account_detail(account_id: str):
    from api.main import risk_engine

    result = risk_engine.score_account(account_id)
    return AccountRisk(**result)

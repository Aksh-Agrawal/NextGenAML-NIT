"""Alert endpoints."""

from fastapi import APIRouter
from api.schemas import AlertRequest

router = APIRouter(tags=["Alerts"])


@router.post("/alert")
def get_alerts(req: AlertRequest):
    """Retrieve accounts above a risk threshold."""
    from api.main import risk_engine

    all_scores = risk_engine.score_all()
    flagged = [
        s for s in all_scores
        if s["risk_score"] / 100 >= req.min_risk
    ]
    flagged.sort(key=lambda x: x["risk_score"], reverse=True)
    return flagged[: req.limit]

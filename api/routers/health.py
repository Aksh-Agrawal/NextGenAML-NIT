"""Health & ping endpoints."""

from fastapi import APIRouter
from api.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/ping")
def ping():
    return {"status": "ok"}


@router.get("/health", response_model=HealthResponse)
def health():
    from api.main import graph_manager, inference_engine

    stats = graph_manager.get_stats()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        graph_loaded=graph_manager.G.number_of_nodes() > 0,
        model_loaded=inference_engine.is_loaded,
        total_accounts=stats["total_accounts"],
        total_transactions=stats["total_transactions"],
    )

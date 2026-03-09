"""Pattern detection endpoints – circular, structuring, dormant."""

from fastapi import APIRouter
from api.schemas import PatternCycle, StructuringPattern, DormantActivation

router = APIRouter(prefix="/patterns", tags=["Pattern Detection"])


@router.get("/circular", response_model=list[PatternCycle])
def get_circular_patterns(min_length: int = 3, max_length: int = 6):
    from api.main import graph_manager

    cycles = graph_manager.detect_circular_patterns(min_length, max_length)
    return [PatternCycle(**c) for c in cycles]


@router.get("/structuring", response_model=list[StructuringPattern])
def get_structuring_patterns(threshold: float = 0, window_minutes: float = 60):
    from api.main import graph_manager

    results = graph_manager.detect_structuring(threshold, window_minutes)
    return [StructuringPattern(**r) for r in results]


@router.get("/dormant", response_model=list[DormantActivation])
def get_dormant_activations(dormant_days: int = 30):
    from api.main import graph_manager

    results = graph_manager.detect_dormant_activations(dormant_days)
    return [DormantActivation(**r) for r in results]


@router.get("/all")
def get_all_patterns():
    """Return all detected patterns in one call."""
    from api.main import graph_manager

    return {
        "circular": graph_manager.detect_circular_patterns(),
        "structuring": graph_manager.detect_structuring(),
        "dormant": graph_manager.detect_dormant_activations(),
    }

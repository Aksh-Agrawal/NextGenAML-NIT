"""Graph query endpoints – subgraph, full graph, stats."""

from fastapi import APIRouter
from api.schemas import SubgraphResponse, GraphStats

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get("/subgraph/{account_id}", response_model=SubgraphResponse)
def get_subgraph(account_id: str, hops: int = 2):
    from api.main import graph_manager

    data = graph_manager.get_subgraph(account_id, hops)
    return SubgraphResponse(**data)


@router.get("/full")
def get_full_graph(limit: int = 500):
    from api.main import graph_manager

    return graph_manager.get_full_graph(limit=limit)


@router.get("/stats", response_model=GraphStats)
def get_graph_stats():
    from api.main import graph_manager

    stats = graph_manager.get_stats()
    return GraphStats(**stats)

"""Graph query endpoints – subgraph, full graph, stats."""

from fastapi import APIRouter
from api.schemas import SubgraphResponse, GraphStats

router = APIRouter(prefix="/graph", tags=["Graph"])


def _enrich_nodes_with_risk_scores(nodes: list[dict]) -> list[dict]:
    """Replace raw label_ratio risk with the composite risk engine score."""
    from api.main import risk_engine

    scored = {s["account_id"]: s["risk_score"] for s in risk_engine.score_all()}
    for node in nodes:
        rid = scored.get(node["id"])
        if rid is not None:
            node["risk"] = rid
    return nodes


@router.get("/subgraph/{account_id}", response_model=SubgraphResponse)
def get_subgraph(account_id: str, hops: int = 2):
    from api.main import graph_manager

    data = graph_manager.get_subgraph(account_id, hops)
    data["nodes"] = _enrich_nodes_with_risk_scores(data["nodes"])
    return SubgraphResponse(**data)


@router.get("/flow")
def get_transaction_flow(account_id: str | None = None, limit: int = 200, offset: int = 0):
    """Chronological transaction stream for one-transaction-at-a-time playback."""
    from api.main import graph_manager

    return graph_manager.get_transaction_flow(account_id, limit, offset)


@router.get("/full")
def get_full_graph(limit: int = 500):
    from api.main import graph_manager

    data = graph_manager.get_full_graph(limit=limit)
    data["nodes"] = _enrich_nodes_with_risk_scores(data["nodes"])
    return data


@router.get("/stats", response_model=GraphStats)
def get_graph_stats():
    from api.main import graph_manager

    stats = graph_manager.get_stats()
    return GraphStats(**stats)

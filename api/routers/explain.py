"""Explainability endpoint – why an account is flagged."""

from fastapi import APIRouter
from api.schemas import ExplainResponse

router = APIRouter(tags=["Explainability"])


@router.get("/explain/{account_id}", response_model=ExplainResponse)
def explain_account(account_id: str):
    from api.main import risk_engine, graph_manager, inference_engine

    score_data = risk_engine.score_account(account_id)
    feat = graph_manager.get_account_features(account_id) or {}
    prediction = inference_engine.predict(account_id)

    risk_factors = []

    if score_data["ml_score"] > 0.5:
        risk_factors.append({
            "factor": "ML Model Prediction",
            "score": score_data["ml_score"],
            "description": f"GNN model predicts {score_data['ml_score']:.1%} fraud probability",
        })

    if score_data["pattern_score"] > 0:
        risk_factors.append({
            "factor": "Pattern Detection",
            "score": score_data["pattern_score"],
            "description": f"Detected pattern: {score_data['pattern_detected']}",
        })

    if score_data["anomaly_score"] > 0.3:
        risk_factors.append({
            "factor": "Statistical Anomaly",
            "score": score_data["anomaly_score"],
            "description": "Transaction velocity or amount is statistically anomalous",
        })

    if feat.get("min_velocity_sec", 999999) < 300:
        risk_factors.append({
            "factor": "Rapid Transactions",
            "score": 0.8,
            "description": f"Minimum gap between transactions: {feat['min_velocity_sec']:.0f}s",
        })

    if feat.get("out_degree", 0) > 5:
        risk_factors.append({
            "factor": "High Fan-out",
            "score": 0.6,
            "description": f"Sends to {feat['out_degree']} different accounts",
        })

    # Top suspicious edges
    top_edges = []
    if account_id in graph_manager.G:
        for neighbor in list(graph_manager.G.successors(account_id)):
            edge_data = graph_manager.G[account_id][neighbor]
            if edge_data.get("is_suspicious"):
                top_edges.append({
                    "source": account_id,
                    "target": neighbor,
                    "amount": edge_data.get("total_amount", 0),
                    "tx_count": edge_data.get("tx_count", 0),
                    "suspicious": True,
                })
                if len(top_edges) >= 5:
                    break

    # Recommendation
    risk = score_data["risk_score"]
    if risk > 75:
        rec = "Immediate investigation required. File SAR with FIU."
    elif risk > 50:
        rec = "Enhanced due diligence recommended. Monitor closely."
    elif risk > 30:
        rec = "Periodic review suggested. No immediate action needed."
    else:
        rec = "Account appears normal. Standard monitoring sufficient."

    return ExplainResponse(
        account_id=account_id,
        risk_score=score_data["risk_score"],
        risk_factors=risk_factors,
        top_suspicious_edges=top_edges,
        recommendation=rec,
    )

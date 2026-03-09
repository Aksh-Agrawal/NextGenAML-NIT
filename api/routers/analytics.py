"""Analytics endpoint – aggregated data for charts."""

from fastapi import APIRouter
from api.schemas import AnalyticsOverview, DashboardMetrics

router = APIRouter(tags=["Analytics"])


@router.get("/analytics", response_model=AnalyticsOverview)
def get_analytics():
    from api.main import graph_manager, risk_engine

    stats = graph_manager.get_stats()
    all_scores = risk_engine.score_all()

    # Transaction trends (mock monthly aggregation from real data)
    df = graph_manager.get_dataframe()
    trends = {}
    if df is not None and len(df) > 0:
        df_copy = df.copy()
        df_copy["month"] = df_copy["timestamp"].dt.strftime("%b")
        monthly = df_copy.groupby("month").agg(
            total_volume=("amount", "sum"),
            suspicious_volume=("amount", lambda x: x[df_copy.loc[x.index, "label"] == 1].sum()),
            tx_count=("amount", "count"),
        ).to_dict("index")
        trends = monthly

    # Pattern frequency
    patterns = {}
    for s in all_scores:
        p = s["pattern_detected"]
        patterns[p] = patterns.get(p, 0) + 1

    # Risk distribution
    dist = stats["risk_distribution"]

    return AnalyticsOverview(
        transaction_trends=trends,
        risk_distribution=dist,
        pattern_frequency=patterns,
        flagged_amount=stats["suspicious_volume"],
        total_volume=stats["total_volume"],
    )


@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics():
    """Main dashboard KPIs and recent activity."""
    from api.main import graph_manager, risk_engine

    stats = graph_manager.get_stats()
    all_scores = risk_engine.score_all()
    df = graph_manager.get_dataframe()

    flagged_amount = stats["suspicious_volume"]
    high_risk = sum(1 for s in all_scores if s["risk_score"] > 50)
    active_cases = sum(1 for s in all_scores if s["status"] in ("Critical", "Flagged"))

    # System risk score (average of all risk scores)
    avg_risk = sum(s["risk_score"] for s in all_scores) / max(len(all_scores), 1)

    # Recent activity (last 10 suspicious transactions)
    recent = []
    if df is not None:
        suspicious = df[df["label"] == 1].sort_values("timestamp", ascending=False).head(10)
        for _, row in suspicious.iterrows():
            recent.append({
                "id": f"TX_{row['sender_account']}_{row['receiver_account']}",
                "sender": row["sender_account"],
                "receiver": row["receiver_account"],
                "amount": float(row["amount"]),
                "timestamp": str(row["timestamp"]),
                "pattern": "Structuring pattern detected in transfer",
            })

    # Monthly trends
    trends = {}
    if df is not None and len(df) > 0:
        df_copy = df.copy()
        df_copy["month"] = df_copy["timestamp"].dt.strftime("%b")
        monthly = df_copy.groupby("month")["amount"].sum().to_dict()
        trends = monthly

    return DashboardMetrics(
        total_transactions=stats["total_transactions"],
        total_volume=stats["total_volume"],
        flagged_amount=flagged_amount,
        high_risk_entities=high_risk,
        active_cases=active_cases,
        system_risk_score=round(avg_risk, 1),
        recent_activity=recent,
        trends=trends,
    )

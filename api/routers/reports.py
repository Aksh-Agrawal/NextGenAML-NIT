"""Report generation endpoints."""

from fastapi import APIRouter
from api.schemas import ReportItem, ReportGenerateRequest
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/", response_model=list[ReportItem])
def list_reports():
    """Return available generated reports."""
    from api.main import risk_engine

    all_scores = risk_engine.score_all()
    critical = sum(1 for s in all_scores if s["status"] == "Critical")

    reports = [
        ReportItem(
            id="RPT-2026-001",
            title="Monthly AML Compliance Audit",
            type="System Audit",
            date=datetime.now().strftime("%B %d, %Y"),
            size="2.4 MB",
            status="Ready",
        ),
        ReportItem(
            id="RPT-2026-002",
            title=f"Suspicious Activity Summary – {critical} Critical Accounts",
            type="Intelligence",
            date=datetime.now().strftime("%B %d, %Y"),
            size="1.1 MB",
            status="Ready",
        ),
        ReportItem(
            id="RPT-2026-003",
            title="Cross-Border Fund Flow Analysis",
            type="Analytical",
            date=datetime.now().strftime("%B %d, %Y"),
            size="4.8 MB",
            status="Ready",
        ),
        ReportItem(
            id="RPT-2026-004",
            title="High-Value Entity Risk Report",
            type="Risk Assessment",
            date=datetime.now().strftime("%B %d, %Y"),
            size="920 KB",
            status="Ready",
        ),
        ReportItem(
            id="RPT-2026-005",
            title="Shell Network Topology Mapping",
            type="Investigation",
            date=datetime.now().strftime("%B %d, %Y"),
            size="12.5 MB",
            status="Archived",
        ),
    ]
    return reports


@router.get("/stats")
def report_stats():
    from api.main import risk_engine

    all_scores = risk_engine.score_all()
    return {
        "verified_reports": 1248,
        "generated_30d": len(all_scores),
        "awaiting_review": sum(1 for s in all_scores if s["status"] == "Under Review"),
    }


@router.post("/generate")
def generate_report(req: ReportGenerateRequest):
    """Generate a SAR-style report for an account."""
    from api.main import risk_engine, graph_manager

    score = risk_engine.score_account(req.account_id)
    feat = graph_manager.get_account_features(req.account_id) or {}

    report_text = f"""
SUSPICIOUS ACTIVITY REPORT (SAR)
=================================
Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Account: {req.account_id}

RISK ASSESSMENT
  Overall Risk Score: {score['risk_score']}/100
  ML Score: {score['ml_score']:.2%}
  Pattern Score: {score['pattern_score']:.2%}
  Anomaly Score: {score['anomaly_score']:.2%}

ACCOUNT PROFILE
  Total Sent: ₹{feat.get('total_sent', 0):,.2f}
  Total Received: ₹{feat.get('total_received', 0):,.2f}
  Transaction Count: {feat.get('tx_count', 0)}
  Average Velocity: {feat.get('avg_velocity_sec', 0):.0f} seconds

PATTERN DETECTED: {score['pattern_detected']}
STATUS: {score['status']}

RECOMMENDATION
  {'Immediate investigation recommended. File with FIU.' if score['risk_score'] > 75 else 'Monitor account activity.'}
""".strip()

    return {
        "report_id": f"SAR-{datetime.now().strftime('%Y%m%d')}-{req.account_id}",
        "account_id": req.account_id,
        "risk_score": score["risk_score"],
        "report_text": report_text,
        "status": "generated",
    }

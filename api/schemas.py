"""Pydantic request / response schemas for the API."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── Enums ──────────────────────────────────────────────
class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AccountStatus(str, Enum):
    VERIFIED = "Verified"
    UNDER_REVIEW = "Under Review"
    FLAGGED = "Flagged"
    CRITICAL = "Critical"


# ── Request Models ─────────────────────────────────────
class TransactionInput(BaseModel):
    sender_account: str
    receiver_account: str
    amount: float
    currency: str = "INR"
    transaction_type: str = "transfer"


class BatchPredictionRequest(BaseModel):
    account_ids: list[str]


class AlertRequest(BaseModel):
    min_risk: float = 0.5
    limit: int = 20


class ReportGenerateRequest(BaseModel):
    account_id: str
    include_graph: bool = True


# ── Response Models ────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    version: str
    graph_loaded: bool
    model_loaded: bool
    total_accounts: int
    total_transactions: int


class PredictionResponse(BaseModel):
    account_id: str
    fraud_probability: float
    risk_level: RiskLevel
    confidence: float
    attention_weights: list[float] = []


class PatternCycle(BaseModel):
    account_chain: list[str]
    total_flow: float
    cycle_length: int


class StructuringPattern(BaseModel):
    sender: str
    transactions: int
    total_amount: float
    avg_amount: float
    time_window_minutes: float


class DormantActivation(BaseModel):
    account_id: str
    dormant_days: int
    activation_amount: float
    activation_date: str


class AccountRisk(BaseModel):
    account_id: str
    risk_score: float
    pattern_detected: str
    status: AccountStatus
    volume_30d: float
    transaction_count: int
    fusion_weights: dict = {}


class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    risk: float


class GraphEdge(BaseModel):
    source: str
    target: str
    value: float
    is_suspicious: bool = False


class SubgraphResponse(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphEdge]
    center_account: str


class GraphStats(BaseModel):
    total_accounts: int
    total_transactions: int
    flagged_accounts: int
    total_volume: float
    avg_transaction: float
    suspicious_volume: float
    risk_distribution: dict


class ModelInfo(BaseModel):
    model_type: str
    version: str
    num_layers: int
    input_features: int
    fraud_threshold: float
    training_epochs: int
    last_trained: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float


class ExplainResponse(BaseModel):
    account_id: str
    risk_score: float
    risk_factors: list[dict]
    top_suspicious_edges: list[dict]
    recommendation: str


class MonitorResponse(BaseModel):
    transaction_id: str
    status: str
    risk_score: float
    flags: list[str]


class MetricsSummary(BaseModel):
    total_transactions_processed: int
    total_alerts_generated: int
    average_risk_score: float
    model_inference_latency_ms: float
    uptime_seconds: float


class AnalyticsOverview(BaseModel):
    transaction_trends: dict
    risk_distribution: dict
    pattern_frequency: dict
    flagged_amount: float
    total_volume: float


class TimelineEvent(BaseModel):
    id: int
    time: str
    date: str
    type: str
    title: str
    description: str
    location: str
    status: str
    amount: float = 0.0


class ReportItem(BaseModel):
    id: str
    title: str
    type: str
    date: str
    size: str
    status: str


class DashboardMetrics(BaseModel):
    total_transactions: int
    total_volume: float
    flagged_amount: float
    high_risk_entities: int
    active_cases: int
    system_risk_score: float
    recent_activity: list[dict]
    trends: dict


# ── Simulator ──────────────────────────────────────────
class SimulatorPayRequest(BaseModel):
    """One dummy UPI payment. Sender/receiver resolvable via account_id,
    mobile number or UPI id."""

    sender: str | None = None
    mobile: str | None = None
    upi_id: str | None = None
    receiver: str | None = None
    to_mobile: str | None = None
    to_upi_id: str | None = None
    amount: float = Field(gt=0)
    remark: str = ""
    device_id: str = ""
    ip: str = ""
    location: str = ""
    channel: str = "UPI"
    currency: str = "INR"
    transaction_type: str = "transfer"


class SimulatorSimulateRequest(BaseModel):
    """Generate a single random / preset-driven transaction."""
    preset: str | None = None


class SimulatorStreamRequest(BaseModel):
    """Start / pause / resume / stop the streaming engine."""
    tps: int = Field(5, ge=1, le=100)
    preset: str | None = None


class SimulatorPresetRequest(BaseModel):
    """Control a named fraud preset."""
    action: str = "start"  # start | pause | resume | stop
    tps: int = Field(5, ge=1, le=100)

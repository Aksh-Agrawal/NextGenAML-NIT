"""Prediction endpoints – single and batch account risk scoring."""

from fastapi import APIRouter
from api.schemas import PredictionResponse, BatchPredictionRequest, TransactionInput, MonitorResponse
import uuid

router = APIRouter(tags=["Predictions"])


@router.post("/predict", response_model=PredictionResponse)
def predict_single(account_id: str):
    from api.main import inference_engine

    result = inference_engine.predict(account_id)
    return PredictionResponse(**result)


@router.post("/predict/batch", response_model=list[PredictionResponse])
def predict_batch(req: BatchPredictionRequest):
    from api.main import inference_engine

    results = inference_engine.predict_batch(req.account_ids)
    return [PredictionResponse(**r) for r in results]


@router.post("/monitor/transaction", response_model=MonitorResponse)
def monitor_transaction(tx: TransactionInput):
    """Real-time transaction scoring."""
    from api.main import inference_engine, risk_engine

    flags = []
    sender_pred = inference_engine.predict(tx.sender_account)
    receiver_pred = inference_engine.predict(tx.receiver_account)

    max_prob = max(sender_pred["fraud_probability"], receiver_pred["fraud_probability"])

    if tx.amount > 1_000_000:
        flags.append("high_value_transfer")
    if tx.amount > 900_000 and tx.amount < 1_000_000:
        flags.append("possible_structuring")
    if sender_pred["fraud_probability"] > 0.5:
        flags.append(f"sender_high_risk ({sender_pred['risk_level']})")
    if receiver_pred["fraud_probability"] > 0.5:
        flags.append(f"receiver_high_risk ({receiver_pred['risk_level']})")

    status = "suspicious" if max_prob > 0.5 or len(flags) > 0 else "normal"

    return MonitorResponse(
        transaction_id=f"TX-{uuid.uuid4().hex[:8].upper()}",
        status=status,
        risk_score=round(max_prob, 4),
        flags=flags,
    )

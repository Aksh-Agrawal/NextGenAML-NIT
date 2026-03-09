"""CSV upload endpoint – allows users to upload transaction data."""

import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from loguru import logger

from api.config import settings

router = APIRouter(prefix="/upload", tags=["Upload"])

REQUIRED_COLUMNS = {"sender_account", "receiver_account", "amount", "timestamp"}


@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload a transaction CSV file. The file must contain at minimum:
    sender_account, receiver_account, amount, timestamp.
    Optional: label, transaction_type, currency.

    After upload the graph, ML model, and risk scores are fully recomputed.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    # Read and validate
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        df.columns = df.columns.str.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {', '.join(sorted(missing))}",
        )

    # Persist the file so it survives restarts
    dest = settings.TRANSACTION_CSV
    dest.write_bytes(contents)
    logger.info(f"Saved uploaded CSV ({len(df)} rows) to {dest}")

    # Reload the entire pipeline
    from api.main import graph_manager, inference_engine, risk_engine

    count = graph_manager.load_from_csv(str(dest))

    # Retrain ML model on new data
    inference_engine.initialize()
    saved_model = settings.SAVED_MODELS_DIR / "aml_model.pt"
    inference_engine.save_model(saved_model)

    # Recompute risk scores & patterns
    risk_engine.compute_patterns()

    logger.info(f"Pipeline reloaded: {count} transactions, {graph_manager.G.number_of_nodes()} accounts")

    return {
        "status": "ok",
        "filename": file.filename,
        "rows": count,
        "accounts": graph_manager.G.number_of_nodes(),
        "edges": graph_manager.G.number_of_edges(),
    }


@router.get("/status")
def upload_status():
    """Return info about the currently loaded dataset."""
    from api.main import graph_manager

    df = graph_manager.get_dataframe()
    if df is None or len(df) == 0:
        return {"loaded": False, "rows": 0, "accounts": 0, "edges": 0}

    return {
        "loaded": True,
        "rows": len(df),
        "accounts": graph_manager.G.number_of_nodes(),
        "edges": graph_manager.G.number_of_edges(),
        "columns": list(df.columns),
    }

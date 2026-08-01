"""Application configuration loaded from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    # --- Memgraph ---
    MEMGRAPH_HOST: str = os.getenv("MEMGRAPH_HOST", "127.0.0.1")
    MEMGRAPH_PORT: int = int(os.getenv("MEMGRAPH_PORT", "7687"))

    # --- FastAPI ---
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8089"))
    API_SECRET_TOKEN: str = os.getenv("API_SECRET_TOKEN", "changeme_in_production")

    # --- GNN Model ---
    GNN_MODEL_TYPE: str = os.getenv("GNN_MODEL_TYPE", "graphsage")
    GNN_FRAUD_THRESHOLD: float = float(os.getenv("GNN_FRAUD_THRESHOLD", "0.75"))

    # --- Risk fusion ---
    USE_ADAPTIVE_FUSION: bool = os.getenv("USE_ADAPTIVE_FUSION", "true").strip().lower() in (
        "1", "true", "yes", "on",
    )
    CHECKPOINTS_DIR: Path = BASE_DIR / "ml" / "checkpoints"

    # --- Training ---
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "64"))
    NUM_EPOCHS: int = int(os.getenv("NUM_EPOCHS", "50"))
    LEARNING_RATE: float = float(os.getenv("LEARNING_RATE", "0.001"))

    # --- Paths ---
    DATA_DIR: Path = BASE_DIR / "data"
    TRANSACTION_CSV: Path = DATA_DIR / "uploaded_transactions.csv"
    SAVED_MODELS_DIR: Path = BASE_DIR / "saved_models"
    LOGS_DIR: Path = BASE_DIR / "logs"

    # --- Google Gemini ---
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    # --- CORS ---
    FRONTEND_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://localhost:3000,"
            "http://localhost:3001,http://127.0.0.1:5173,http://127.0.0.1:3000,"
            "https://nextaml-iim.onrender.com,https://nextgenaml.onrender.com,"
            "https://nextgenaml-1.onrender.com",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(exist_ok=True)
settings.SAVED_MODELS_DIR.mkdir(exist_ok=True)
settings.LOGS_DIR.mkdir(exist_ok=True)
settings.CHECKPOINTS_DIR.mkdir(exist_ok=True)

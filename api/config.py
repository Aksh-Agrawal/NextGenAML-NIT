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
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")
    VOICE_AUTH_LLM_PROVIDER: str = os.getenv("VOICE_AUTH_LLM_PROVIDER", "gemini")

    # --- Sarvam / Twilio Voice Authentication ---
    VOICE_AUTH_ENABLED: bool = os.getenv("VOICE_AUTH_ENABLED", "true").strip().lower() in (
        "1", "true", "yes", "on",
    )
    VOICE_AUTH_MOCK_MODE: bool = os.getenv("VOICE_AUTH_MOCK_MODE", "true").strip().lower() in (
        "1", "true", "yes", "on",
    )
    VOICE_AUTH_THRESHOLD: float = float(os.getenv("VOICE_AUTH_THRESHOLD", "60"))
    VOICE_AUTH_MANUAL_REVIEW_THRESHOLD: float = float(
        os.getenv("VOICE_AUTH_MANUAL_REVIEW_THRESHOLD", "80")
    )
    VOICE_AUTH_RETRY_SECONDS: int = int(os.getenv("VOICE_AUTH_RETRY_SECONDS", "300"))
    VOICE_AUTH_LANGUAGE: str = os.getenv("VOICE_AUTH_LANGUAGE", "hi-IN,en-IN")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    SARVAM_TTS_MODEL: str = os.getenv("SARVAM_TTS_MODEL", "bulbul:v2")
    SARVAM_STT_MODEL: str = os.getenv("SARVAM_STT_MODEL", "saaras:v2")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    TWILIO_PUBLIC_BASE_URL: str = os.getenv("TWILIO_PUBLIC_BASE_URL", "")

    # --- Transaction Simulator ---
    SIMULATOR_REPLAY_LEDGER: bool = os.getenv("SIMULATOR_REPLAY_LEDGER", "false").strip().lower() in (
        "1", "true", "yes", "on",
    )
    SIMULATOR_LEDGER_PATH: Path = BASE_DIR / "data" / "simulator_ledger.jsonl"
    SIMULATOR_ALERTS_PATH: Path = BASE_DIR / "data" / "simulator_alerts.jsonl"
    SIMULATOR_MAX_TPS: int = int(os.getenv("SIMULATOR_MAX_TPS", "100"))

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

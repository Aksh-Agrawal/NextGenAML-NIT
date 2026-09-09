"""
NextGenAML – FastAPI Backend
============================
Main application entry point. Initializes the graph, ML model, risk engine,
and registers all API routers.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from loguru import logger
import sys

from api.config import settings
from graph_db.manager import GraphManager
from ml.inference import InferenceEngine
from ml.risk_engine import RiskEngine
from simulator.service import SimulatorService

# ── Global singletons (populated on startup) ──────────
graph_manager = GraphManager()
inference_engine = InferenceEngine(graph_manager, model_type=settings.GNN_MODEL_TYPE)
risk_engine = RiskEngine(graph_manager, inference_engine)
simulator_service = SimulatorService(graph_manager, inference_engine, risk_engine)

# ── Logging ───────────────────────────────────────────
logger.remove()
logger.add(sys.stderr, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level:<8}</level> | {message}")
logger.add(str(settings.LOGS_DIR / "api.log"), rotation="10 MB", retention="7 days", level="DEBUG")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load data → build graph → train model → compute patterns."""
    logger.info("=" * 60)
    logger.info("NextGenAML API starting up ...")

    # 1. Load transaction data
    csv_path = settings.TRANSACTION_CSV
    if csv_path.exists():
        count = graph_manager.load_from_csv(str(csv_path))
        logger.info(f"Loaded {count} transactions from {csv_path.name}")
    else:
        logger.warning(f"Transaction CSV not found at {csv_path}, running with empty graph")

    # 2. Optionally connect to Memgraph
    try:
        graph_manager.connect_memgraph(settings.MEMGRAPH_HOST, settings.MEMGRAPH_PORT)
        graph_manager.sync_to_memgraph()
    except Exception as e:
        logger.warning(f"Memgraph connection skipped: {e}")

    # 3. Initialize ML model
    saved_model = settings.SAVED_MODELS_DIR / "aml_model.pt"
    if not inference_engine.load_model(saved_model):
        logger.info("No saved model found – training from scratch ...")
        inference_engine.initialize()
        inference_engine.save_model(saved_model)

    # 4. Pre-compute pattern detection
    risk_engine.compute_patterns()
    risk_engine.refresh_scores()

    # 5. Optionally replay the simulator ledger into the graph (off by default)
    if settings.SIMULATOR_REPLAY_LEDGER:
        simulator_service.replay_ledger()

    logger.info("NextGenAML API ready!")
    logger.info("=" * 60)

    yield  # app is running

    logger.info("NextGenAML API shutting down")
    simulator_service.shutdown()


# ── App ───────────────────────────────────────────────
app = FastAPI(
    title="NextGenAML API",
    description="Anti-Money Laundering Detection System – Graph Neural Network powered API",
    version="1.0.0",
    lifespan=lifespan,
)
# ── CORS ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ─────────────────────────────────
from api.routers import (
    health,
    predictions,
    patterns,
    graph,
    accounts,
    alerts,
    explain,
    analytics,
    model_info,
    reports,
    timeline,
    upload,
    simulator,
)

app.include_router(health.router)
app.include_router(predictions.router)
app.include_router(patterns.router)
app.include_router(graph.router)
app.include_router(accounts.router)
app.include_router(alerts.router)
app.include_router(explain.router)
app.include_router(analytics.router)
app.include_router(model_info.router)
app.include_router(reports.router)
app.include_router(timeline.router)
app.include_router(upload.router)
app.include_router(simulator.router)
app.include_router(simulator.ws_router)

# ── Frontend static files ─────────────────────────────
_frontend_dir = Path(__file__).resolve().parent.parent / "nextgen-frontend" / "out"

_next_dir = _frontend_dir / "_next"
if _next_dir.exists():
    app.mount("/_next", StaticFiles(directory=str(_next_dir)), name="next-assets")

if _frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_frontend_dir)), name="static")


@app.get("/", include_in_schema=False)
async def serve_frontend():
    index_file = _frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    return JSONResponse(
        {
            "message": "NextGenAML API is running.",
            "docs": "/docs",
            "health": "/health",
        }
    )


@app.get("/{path:path}", include_in_schema=False)
async def serve_frontend_routes(path: str):
    """Serve the Next.js static export (clean URLs + SPA fallback)."""
    if not _frontend_dir.exists():
        return JSONResponse(
            {
                "message": "NextGenAML API is running.",
                "docs": "/docs",
                "health": "/health",
            }
        )

    # Direct file hit (e.g. /_next/static/... is handled by the mounts above)
    file = _frontend_dir / path
    if file.is_file():
        return FileResponse(str(file))

    # Static export generates <route>.html (e.g. /fund-flow -> fund-flow.html)
    html = _frontend_dir / f"{path}.html"
    if html.is_file():
        return FileResponse(str(html))

    # SPA fallback: unknown deep links render the root shell
    index_file = _frontend_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    return JSONResponse(
        {
            "message": "NextGenAML API is running.",
            "docs": "/docs",
            "health": "/health",
        }
    )

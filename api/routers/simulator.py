"""
Simulator endpoints – real-time UPI payments, live streaming, fraud presets,
history, alerts, stats, and the ``/ws/live`` push channel.
"""

from __future__ import annotations
import json
import random
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from loguru import logger

from api.schemas import (
    SimulatorPayRequest,
    SimulatorSimulateRequest,
    SimulatorStreamRequest,
    SimulatorPresetRequest,
)
from simulator.presets import PRESET_REGISTRY, PRESET_LABELS, build_generator
from simulator.stream_engine import build_random_generator

router = APIRouter(prefix="/simulator", tags=["Simulator"])
ws_router = APIRouter(tags=["Simulator"])


def _service():
    from api.main import simulator_service
    return simulator_service


@router.get("/accounts")
def list_accounts():
    """Dummy UPI accounts with live wallet balances."""
    return _service().accounts()


@router.post("/pay")
async def pay(req: SimulatorPayRequest):
    """Execute one dummy UPI payment and broadcast it live."""
    service = _service()
    try:
        tx = service.prepare_payment(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return await service.publish(tx)


@router.post("/simulate")
async def simulate(req: SimulatorSimulateRequest):
    """Generate one random (or preset-driven) transaction through the pipeline."""
    service = _service()
    if req.preset and req.preset not in PRESET_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown preset: {req.preset}")

    if req.preset:
        gen = build_generator(req.preset, service.wallet.ids(), random.Random())
        tx = next(gen)
    else:
        tx = next(build_random_generator(service.wallet.ids(), random.Random()))

    return await service.publish(tx)


@router.post("/preset/{name}")
async def preset_control(name: str, req: SimulatorPresetRequest):
    """Run / pause / resume / stop a named fraud scenario preset."""
    service = _service()
    if name not in PRESET_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown preset: {name}")
    return service.stream.dispatch(req.action, tps=req.tps, preset=name)


@router.post("/stream/{action}")
async def stream_control(action: str, req: SimulatorStreamRequest):
    """Start / pause / resume / stop the load generator (1–100 TPS)."""
    return _service().stream.dispatch(action, tps=req.tps, preset=req.preset)


@router.get("/history")
def get_history(
    date_from: str | None = None,
    date_to: str | None = None,
    risk_level: str | None = None,
    sender: str | None = None,
    receiver: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
):
    """Filtered + paginated transaction history."""
    return _service().history(
        date_from=date_from, date_to=date_to, risk_level=risk_level,
        sender=sender, receiver=receiver, min_amount=min_amount,
        max_amount=max_amount, page=page, limit=limit,
    )


@router.get("/alerts")
def get_alerts(limit: int = Query(100, ge=1, le=500)):
    """Live simulator alert registry."""
    return _service().alerts(limit=limit)


@router.get("/stats")
def get_stats():
    """Live statistics payload + stream engine state."""
    return _service().stats_snapshot()


@router.get("/presets")
def get_presets():
    """List available fraud scenario presets."""
    return {
        "presets": [
            {"name": name, "label": PRESET_LABELS.get(name, name)}
            for name in sorted(PRESET_REGISTRY)
        ],
        "tps_options": [1, 5, 10, 50, 100],
    }


@ws_router.websocket("/ws/live")
async def ws_live(websocket: WebSocket):
    """Push channel broadcasting NEW_TRANSACTION envelopes to all clients."""
    service = _service()
    await websocket.accept()
    service.register_socket(websocket)
    logger.info("Simulator websocket client connected")
    try:
        while True:
            message = await websocket.receive_text()
            if message.strip() == "ping":
                await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        service.unregister_socket(websocket)
        logger.info("Simulator websocket client disconnected")

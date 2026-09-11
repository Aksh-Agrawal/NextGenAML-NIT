"""Voice authentication endpoints for held UPI simulator transactions."""

from __future__ import annotations

from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter(prefix="/voice", tags=["Voice Auth"])


class VoiceDecisionRequest(BaseModel):
    confirmed: bool
    transcript: str = ""
    notes: str = ""


class VoiceSpeechRequest(BaseModel):
    speech: str = ""
    digits: str = ""


def _voice():
    from api.main import voice_auth_service
    return voice_auth_service


@router.get("/pending")
def pending_confirmations():
    return _voice().list_pending()


@router.get("/pending/{confirmation_id}")
def confirmation_status(confirmation_id: str):
    item = _voice().get(confirmation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Unknown confirmation")
    return item


@router.get("/stats")
def voice_stats():
    return _voice().stats()


@router.post("/call/initiate/{confirmation_id}")
def retry_call(confirmation_id: str):
    try:
        return _voice().initiate_call(confirmation_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown confirmation")


@router.post("/confirm/{confirmation_id}")
async def confirm_transaction(confirmation_id: str, req: VoiceDecisionRequest):
    try:
        return _voice().resolve(
            confirmation_id,
            decision="confirmed" if req.confirmed else "denied",
            transcript=req.transcript,
            analyst_notes=req.notes,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown confirmation")


@router.post("/respond/{confirmation_id}")
async def respond_from_mock_ui(confirmation_id: str, req: VoiceSpeechRequest):
    try:
        return _voice().process_spoken_response(
            confirmation_id,
            speech=req.speech,
            digits=req.digits,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown confirmation")


@router.post("/twilio/status/{confirmation_id}")
async def twilio_status(confirmation_id: str, CallStatus: str = Form("")):
    try:
        return _voice().register_call_status(confirmation_id, CallStatus)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown confirmation")


@router.post("/twilio/gather/{confirmation_id}")
async def twilio_gather(
    confirmation_id: str,
    SpeechResult: str = Form(""),
    Digits: str = Form(""),
):
    try:
        result = _voice().process_spoken_response(
            confirmation_id,
            speech=SpeechResult,
            digits=Digits,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown confirmation")

    approved = result.get("transaction", {}).get("status") == "success"
    phrase = (
        "Thank you. Your transaction is confirmed and will proceed."
        if approved
        else "Thank you. Your transaction has been held and withdrawn."
    )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Say language="en-IN" voice="alice">{phrase}</Say></Response>'
    )
    return Response(content=body, media_type="text/xml")


@router.post("/twiml/{confirmation_id}")
def twilio_twiml(confirmation_id: str):
    try:
        body = _voice().twiml_for(confirmation_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown confirmation")
    return Response(content=body, media_type="text/xml")

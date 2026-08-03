from __future__ import annotations

import os
import time
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import ValidationError

from . import __version__
from .ephemeral_observation import MAX_AUDIO_BYTES, observe_ephemeral_wav
from .auth import ReplayLedger, verify
from .engine import DecisionEngine
from .models import AttemptEnvelope, EphemeralObservationRequest
from .registry import BlockRegistry

PACK_ROOT = Path(os.environ.get("SCHOLARIUM_TEACH_PACK_ROOT", Path.cwd() / "packs"))
registry = BlockRegistry(PACK_ROOT)
registry.load_published()
replay_ledger = ReplayLedger()
app = FastAPI(title="Scholarium Teach Engine", version=__version__, docs_url=None, redoc_url=None)


async def authenticated(request: Request, x_teach_timestamp: str | None, x_teach_nonce: str | None, x_teach_signature: str | None) -> bytes:
    body = await request.body()
    secret = os.environ.get("SCHOLARIUM_TEACH_ENGINE_HMAC_SECRET", "")
    try:
        issued_at = int(x_teach_timestamp or "")
    except ValueError as error:
        raise HTTPException(401, "invalid_engine_timestamp") from error
    if not secret or not x_teach_nonce or not x_teach_signature:
        raise HTTPException(503 if not secret else 401, "engine_authentication_unavailable")
    if not verify(secret, x_teach_signature, request.method, request.url.path, issued_at, x_teach_nonce, body):
        raise HTTPException(401, "invalid_engine_signature")
    if not replay_ledger.admit(x_teach_nonce, issued_at):
        raise HTTPException(409, "engine_replay_rejected")
    return body


@app.get("/internal/v1/health")
def health():
    blocks = [{"blockId": b.block_id, "version": b.version, "digest": b.content_digest} for b in registry.all()]
    if not blocks:
        raise HTTPException(503, "no_published_content_pack")
    return {"status": "ok", "version": __version__, "blocks": blocks, "canonicalLearnerStateStored": False}


@app.get("/internal/v1/blocks/{block_id}/{version}")
def block(block_id: str, version: str):
    try:
        return registry.get(block_id, version)
    except KeyError as error:
        raise HTTPException(404, "unknown_or_unpublished_block") from error


@app.post("/internal/v1/decisions")
async def decision(request: Request, x_teach_timestamp: str | None = Header(None), x_teach_nonce: str | None = Header(None), x_teach_signature: str | None = Header(None)):
    body = await authenticated(request, x_teach_timestamp, x_teach_nonce, x_teach_signature)
    attempt = AttemptEnvelope.model_validate_json(body)
    try:
        engine = DecisionEngine(registry.get(attempt.checkpoint.block_id, attempt.checkpoint.block_version))
        return engine.decide(attempt)
    except (KeyError, ValueError) as error:
        raise HTTPException(422, str(error)) from error


@app.post("/internal/v1/audio-observations")
async def audio_observation(request: Request, x_teach_timestamp: str | None = Header(None), x_teach_nonce: str | None = Header(None), x_teach_signature: str | None = Header(None)):
    payload = await authenticated(request, x_teach_timestamp, x_teach_nonce, x_teach_signature)
    try:
        if len(payload) > MAX_AUDIO_BYTES:
            raise HTTPException(413, "audio_payload_too_large")
        try:
            metadata = EphemeralObservationRequest(
                request_id=request.headers.get("x-teach-request-id", ""),
                observation_id=request.headers.get("x-teach-observation-id", ""),
                purpose=request.headers.get("x-teach-observation-purpose", ""),
                consent=request.headers.get("x-teach-audio-consent") == "granted",
                subject_kind=request.headers.get("x-teach-subject-kind", ""),
                content_type=request.headers.get("content-type", "").split(";", 1)[0],
            )
        except ValidationError as error:
            raise HTTPException(422, "invalid_ephemeral_observation_metadata") from error
        return observe_ephemeral_wav(metadata, payload)
    finally:
        # Starlette caches the body on the request object. Releasing that
        # reference is measurable application cleanup, not secure zeroisation.
        request._body = b""
        del payload

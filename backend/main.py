"""
IRIS – Bridge Structural Emergency Decision System
FastAPI application with SSE streaming, scenario runner, and REST endpoints.
"""

from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sse_starlette.sse import EventSourceResponse

from engine.pipeline import Pipeline
from models.schemas import SensorReading, SSEUpdate
from pydantic import BaseModel, Field
from simulator.scenarios import ScenarioRunner
from vision import analyze_image

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(name)-20s  %(message)s")
log = logging.getLogger("iris.main")

# ── Shared state ────────────────────────────────────────────────────────────
pipeline = Pipeline()
runner = ScenarioRunner()

# SSE subscribers: each connected client gets its own asyncio.Queue
_subscribers: list[asyncio.Queue[str]] = []


async def _broadcast(update: SSEUpdate) -> None:
    """Push a JSON-serialised update to every connected SSE client."""
    data = update.model_dump_json()
    dead: list[asyncio.Queue[str]] = []
    for q in _subscribers:
        try:
            q.put_nowait(data)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        _subscribers.remove(q)


async def _on_scenario_step(readings: list[SensorReading]) -> None:
    """Callback invoked by the ScenarioRunner for each timestep."""
    update = pipeline.process(readings)
    await _broadcast(update)


# ── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("IRIS backend starting")
    yield
    log.info("IRIS backend shutting down")


# ── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="IRIS – Bridge Emergency Decision System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "IRIS", "status": "running"}


@app.post("/api/sensor-data")
async def ingest_sensor_data(readings: list[SensorReading]):
    """Manual ingestion — run pipeline and broadcast result."""
    if not readings:
        raise HTTPException(status_code=400, detail="No readings provided")
    update = pipeline.process(readings)
    await _broadcast(update)
    return update


@app.get("/api/alerts")
async def get_alerts():
    """Return recent alert history (most-recent first)."""
    return pipeline.get_alerts()


@app.get("/api/status")
async def get_status():
    """Return the last known pipeline update."""
    if pipeline.last_update is None:
        return Response(status_code=204)
    return pipeline.last_update


@app.get("/api/agent-logs")
async def get_agent_logs():
    """Return recent agent activity logs (oldest → newest)."""
    return pipeline.get_agent_logs()


@app.get("/api/scenarios")
async def list_scenarios():
    """List available demo scenarios."""
    return runner.list_scenarios()


@app.post("/api/scenarios/{name}/start")
async def start_scenario(name: str):
    """Start a named demo scenario."""
    try:
        await runner.start(name, _on_scenario_step)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"status": "started", "scenario": name}


# ── Vision / Damage-Scan endpoints ──────────────────────────────────────────

@app.post("/api/vision/analyze")
async def vision_analyze(image: UploadFile = File(...)):
    """Analyze an uploaded image for structural damage (cracks)."""
    if image.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images accepted")
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")
    result = analyze_image(contents)
    return result


class VisionInjectPayload(BaseModel):
    crack_confidence: float = Field(ge=0.0, le=1.0)


def _build_vision_assessment(crack_confidence: float) -> dict:
    """Build a rich, actionable vision-specific assessment from crack confidence."""
    pct = round(crack_confidence * 100, 1)

    if pct >= 80:
        severity = "CRITICAL"
        risk_band = "RED"
        structural_impact = (
            "Severe structural degradation detected. Multiple crack patterns indicate "
            "advanced material fatigue with potential load-bearing capacity reduction."
        )
        urgency_window = "Immediate — within 24 hours"
        actions = [
            "Restrict heavy vehicle traffic (>10 t) on the affected span immediately",
            "Deploy field inspection team for close-range visual & tactile assessment",
            "Install real-time crack-width monitoring sensors at identified locations",
            "Notify structural engineering consultant for load-rating re-evaluation",
            "Prepare contingency lane-closure or full-closure plan",
            "Schedule core sampling / GPR scan to assess sub-surface condition",
        ]
        summary = "Critical structural damage confirmed. Immediate intervention required to ensure public safety."
    elif pct >= 60:
        severity = "HIGH"
        risk_band = "ORANGE"
        structural_impact = (
            "Significant surface cracking observed, suggesting progressive deterioration. "
            "Structural integrity may be compromised under sustained or peak loading."
        )
        urgency_window = "Within 48–72 hours"
        actions = [
            "Schedule priority bridge inspection within 48 hours",
            "Reduce speed limits on affected section as a precaution",
            "Install temporary crack monitoring gauges",
            "Review recent maintenance and load history for the span",
            "Prepare a repair scope estimate for budget allocation",
        ]
        summary = "Significant damage detected. Priority inspection and monitoring recommended."
    elif pct >= 40:
        severity = "MODERATE"
        risk_band = "YELLOW"
        structural_impact = (
            "Moderate surface anomalies detected. Early-stage cracking or weathering patterns "
            "present — not immediately critical but warrants planned follow-up."
        )
        urgency_window = "Within 1–2 weeks"
        actions = [
            "Add to the next scheduled bridge inspection queue",
            "Photograph and document crack locations for trend tracking",
            "Compare with previous inspection records for progression analysis",
            "Consider preventive sealant application on hairline cracks",
        ]
        summary = "Moderate wear detected. Schedule routine inspection and trend monitoring."
    else:
        severity = "LOW"
        risk_band = "GREEN"
        structural_impact = (
            "Minimal or no significant surface damage observed. The structure appears "
            "to be in acceptable condition based on visual analysis."
        )
        urgency_window = "Routine schedule"
        actions = [
            "No immediate action required",
            "Continue regular inspection cycle",
            "Archive scan results for historical comparison",
        ]
        summary = "No significant damage detected. Structure is in acceptable condition."

    return {
        "crack_confidence_pct": pct,
        "severity": severity,
        "risk_band": risk_band,
        "structural_impact": structural_impact,
        "urgency_window": urgency_window,
        "recommended_actions": actions,
        "summary": summary,
        "sensor_injected": {"sensor_id": "VISION-CAM-01", "type": "STRESS", "value_pct": pct},
    }


@app.post("/api/vision/inject")
async def vision_inject(payload: VisionInjectPayload):
    """Convert crack-confidence into a synthetic sensor reading and push through the pipeline."""
    from datetime import datetime as _dt

    reading = SensorReading(
        timestamp=_dt.utcnow().isoformat(),
        sensor_id="VISION-CAM-01",
        sensor_type="STRESS",
        value=payload.crack_confidence * 100,   # map 0..1 → 0..100 stress %
        unit="%",
        bridge_section="main_span",
    )
    update = pipeline.process([reading])
    await _broadcast(update)

    response = update.model_dump()
    response["vision_assessment"] = _build_vision_assessment(payload.crack_confidence)
    return response


@app.get("/api/stream")
async def sse_stream():
    """Server-Sent Events endpoint — real-time pipeline updates."""

    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=64)
    _subscribers.append(queue)

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=15)
                    yield {"event": "update", "data": data}
                except asyncio.TimeoutError:
                    # keep-alive heartbeat
                    yield {"event": "heartbeat", "data": "{}"}
        except asyncio.CancelledError:
            pass
        finally:
            if queue in _subscribers:
                _subscribers.remove(queue)

    return EventSourceResponse(event_generator())


# ── Entry-point for running directly ────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

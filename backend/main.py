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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from engine.pipeline import Pipeline
from models.schemas import SensorReading, SSEUpdate
from simulator.scenarios import ScenarioRunner

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
        return JSONResponse(
            content={"detail": "No data yet"}, status_code=204
        )
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

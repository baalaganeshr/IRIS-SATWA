"""
Scenario Simulator – pre-built time-series data for three demo scenarios.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Callable, Awaitable

from models.schemas import SensorReading
from config import SCENARIO_STEP_INTERVAL

log = logging.getLogger("iris.simulator")


def _ts() -> str:
    return datetime.utcnow().isoformat()


def _readings(
    stress: float,
    vibration: float,
    load: float,
    temperature: float,
    wind: float,
) -> list[SensorReading]:
    """Build a batch of five sensor readings for one timestep."""
    return [
        SensorReading(timestamp=_ts(), sensor_id="S-01", sensor_type="STRESS", value=stress, unit="MPa"),
        SensorReading(timestamp=_ts(), sensor_id="V-01", sensor_type="VIBRATION", value=vibration, unit="mm/s"),
        SensorReading(timestamp=_ts(), sensor_id="L-01", sensor_type="LOAD", value=load, unit="tons"),
        SensorReading(timestamp=_ts(), sensor_id="T-01", sensor_type="TEMPERATURE", value=temperature, unit="°C"),
        SensorReading(timestamp=_ts(), sensor_id="W-01", sensor_type="WIND", value=wind, unit="km/h"),
    ]


# ── Scenario definitions ───────────────────────────────────────────────────
# Each scenario is a list of sensor snapshots played sequentially.

SCENARIOS: dict[str, dict] = {
    "normal": {
        "description": "Normal day — all sensors within safe ranges.",
        "steps": [
            _readings(stress=100, vibration=5,  load=20, temperature=22, wind=10),
            _readings(stress=110, vibration=6,  load=22, temperature=22, wind=12),
            _readings(stress=105, vibration=5,  load=21, temperature=23, wind=11),
            _readings(stress=115, vibration=7,  load=25, temperature=23, wind=14),
            _readings(stress=108, vibration=6,  load=23, temperature=22, wind=12),
            _readings(stress=112, vibration=5,  load=22, temperature=22, wind=10),
            _readings(stress=100, vibration=5,  load=20, temperature=21, wind=10),
            _readings(stress=105, vibration=6,  load=21, temperature=22, wind=11),
        ],
    },
    "storm": {
        "description": "Storm approaching — wind rises, vibration and stress escalate.",
        "steps": [
            _readings(stress=110, vibration=6,   load=25,  temperature=20, wind=15),
            _readings(stress=130, vibration=10,  load=28,  temperature=19, wind=35),
            _readings(stress=170, vibration=15,  load=35,  temperature=18, wind=60),
            _readings(stress=210, vibration=20,  load=40,  temperature=17, wind=85),
            _readings(stress=260, vibration=26,  load=45,  temperature=16, wind=110),
            _readings(stress=300, vibration=30,  load=50,  temperature=15, wind=130),
            _readings(stress=330, vibration=34,  load=55,  temperature=14, wind=140),
            _readings(stress=350, vibration=36,  load=58,  temperature=14, wind=150),
            _readings(stress=310, vibration=30,  load=50,  temperature=15, wind=120),
            _readings(stress=250, vibration=22,  load=40,  temperature=16, wind=80),
        ],
    },
    "critical": {
        "description": "Critical failure — rapid spike to dangerous levels.",
        "steps": [
            _readings(stress=120, vibration=8,   load=30,  temperature=25, wind=20),
            _readings(stress=200, vibration=18,  load=50,  temperature=28, wind=40),
            _readings(stress=320, vibration=30,  load=70,  temperature=32, wind=80),
            _readings(stress=400, vibration=38,  load=85,  temperature=38, wind=120),
            _readings(stress=450, vibration=44,  load=92,  temperature=42, wind=160),
            _readings(stress=480, vibration=48,  load=97,  temperature=45, wind=185),
            _readings(stress=490, vibration=49,  load=99,  temperature=48, wind=195),
            _readings(stress=470, vibration=46,  load=95,  temperature=44, wind=180),
            _readings(stress=420, vibration=40,  load=88,  temperature=40, wind=150),
            _readings(stress=350, vibration=32,  load=70,  temperature=35, wind=110),
        ],
    },
}


class ScenarioRunner:
    """Manages running demo scenarios asynchronously."""

    def __init__(self) -> None:
        self._running: str | None = None
        self._task: asyncio.Task | None = None

    @property
    def is_running(self) -> bool:
        return self._running is not None

    @property
    def current(self) -> str | None:
        return self._running

    async def start(
        self,
        name: str,
        on_step: Callable[[list[SensorReading]], Awaitable[None]],
    ) -> None:
        """Start a named scenario.  Cancels any running one first."""
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        scenario = SCENARIOS.get(name)
        if scenario is None:
            raise ValueError(f"Unknown scenario: {name}")

        self._running = name
        self._task = asyncio.create_task(self._play(name, scenario["steps"], on_step))

    async def _play(
        self,
        name: str,
        steps: list[list[SensorReading]],
        on_step: Callable[[list[SensorReading]], Awaitable[None]],
    ) -> None:
        log.info("Scenario '%s' started (%d steps)", name, len(steps))
        try:
            for i, batch in enumerate(steps):
                # rebuild timestamps to be current
                for r in batch:
                    r.timestamp = _ts()
                await on_step(batch)
                log.info("  step %d/%d done", i + 1, len(steps))
                if i < len(steps) - 1:
                    await asyncio.sleep(SCENARIO_STEP_INTERVAL)
        except asyncio.CancelledError:
            log.info("Scenario '%s' cancelled", name)
        finally:
            self._running = None
            log.info("Scenario '%s' finished", name)

    def list_scenarios(self) -> list[dict]:
        return [
            {
                "name": name,
                "description": data["description"],
                "running": self._running == name,
            }
            for name, data in SCENARIOS.items()
        ]

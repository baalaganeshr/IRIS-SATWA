"""
Pydantic data models for the IRIS pipeline.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

# ── Enums / Literals ────────────────────────────────────────────────────────

SensorType = Literal["STRESS", "VIBRATION", "LOAD", "TEMPERATURE", "WIND"]
RiskLevel = Literal["GREEN", "YELLOW", "ORANGE", "RED"]
ActionLevel = Literal["MONITOR", "WARN", "RESTRICT", "EVACUATE"]


# ── Sensor data ─────────────────────────────────────────────────────────────

class SensorReading(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    sensor_id: str
    sensor_type: SensorType
    value: float
    unit: str
    bridge_section: str = "main_span"


class NormalizedReading(BaseModel):
    sensor_id: str
    sensor_type: SensorType
    raw_value: float
    normalized_value: float  # 0 – 1
    unit: str
    anomaly: bool = False
    bridge_section: str = "main_span"


# ── Risk ────────────────────────────────────────────────────────────────────

class SensorBreakdown(BaseModel):
    stress_score: float = 0.0
    vibration_score: float = 0.0
    load_score: float = 0.0
    environmental_score: float = 0.0


class RiskAssessment(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    breakdown: SensorBreakdown
    contributing_factors: list[str] = []
    forced_red: bool = False
    forced_red_reason: Optional[str] = None


# ── Decision ────────────────────────────────────────────────────────────────

class Decision(BaseModel):
    action: ActionLevel
    urgency: str
    recommended_actions: list[str]
    justification: str


# ── Alert ───────────────────────────────────────────────────────────────────

class Alert(BaseModel):
    severity: str
    title: str
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ── Agent activity log ──────────────────────────────────────────────────────

AgentName = Literal["Ingestion", "RiskScorer", "Decision", "Alert"]


class AgentLog(BaseModel):
    id: str
    timestamp: str
    agent: AgentName
    message: str


# ── SSE update (everything the frontend needs) ─────────────────────────────

class SSEUpdate(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    risk: RiskAssessment
    decision: Decision
    alert: Optional[Alert] = None
    agent_logs: list[AgentLog] = []


# ── Scenario metadata ──────────────────────────────────────────────────────

class ScenarioInfo(BaseModel):
    name: str
    description: str
    running: bool = False

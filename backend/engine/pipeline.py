"""
Pipeline – chains the four agents: Ingestion → Risk Scorer → Decision → Alerter.
"""

from __future__ import annotations

import logging
import time
from collections import deque
from datetime import datetime

from agents.ingestion import IngestionAgent
from agents.risk_scorer import RiskScorerAgent
from agents.decision import DecisionAgent
from agents.alerter import AlertAgent
from models.schemas import AgentLog, Alert, Forecast, SensorReading, SSEUpdate
from ml.predictor import RiskForecaster

log = logging.getLogger("iris.pipeline")


class Pipeline:
    """Orchestrates data flow through all four IRIS agents."""

    def __init__(self) -> None:
        self.ingestion = IngestionAgent()
        self.risk_scorer = RiskScorerAgent()
        self.decision_agent = DecisionAgent()
        self.alert_agent = AlertAgent()

        # keep last-known state for /api/status
        self.last_update: SSEUpdate | None = None

        # agent activity log buffer
        self._agent_logs: deque[AgentLog] = deque(maxlen=100)
        self._log_seq: int = 0

        # ML forecasting
        self._forecaster = RiskForecaster()
        self._history: deque[list[float]] = deque(maxlen=300)

    def _make_log(self, agent: str, message: str) -> AgentLog:
        """Create an AgentLog with a unique id."""
        self._log_seq += 1
        log_id = f"{int(time.time() * 1000)}-{self._log_seq}"
        entry = AgentLog(
            id=log_id,
            timestamp=datetime.utcnow().isoformat(),
            agent=agent,  # type: ignore[arg-type]
            message=message,
        )
        self._agent_logs.append(entry)
        return entry

    def process(self, readings: list[SensorReading]) -> SSEUpdate:
        """Run the full agent pipeline and return an SSEUpdate."""
        batch: list[AgentLog] = []

        # 1 – Ingestion
        normalized = self.ingestion.process(readings)
        log.info("Ingestion: %d readings → %d normalized", len(readings), len(normalized))
        batch.append(self._make_log("Ingestion", f"Received {len(readings)} readings → {len(normalized)} normalized"))

        # 2 – Risk scoring
        risk = self.risk_scorer.assess(normalized)
        log.info("Risk: score=%d  level=%s", risk.overall_score, risk.risk_level)
        batch.append(self._make_log("RiskScorer", f"Score: {risk.overall_score}/100 — Level: {risk.risk_level}"))

        # 2b – Append sensor vector for ML history
        bd = risk.breakdown
        self._history.append([
            bd.stress_score,
            bd.vibration_score,
            bd.load_score,
            bd.environmental_score,
        ])

        # 2c – ML forecast (advisory only)
        forecast: Forecast | None = None
        if len(self._history) >= 10:
            fc = self._forecaster.forecast_trend(list(self._history), risk.overall_score)
            if fc["predicted_risk"] is not None:
                forecast = Forecast(predicted_risk=fc["predicted_risk"], trend=fc["trend"])
                risk.predicted_risk = fc["predicted_risk"]
                risk.trend = fc["trend"]
                log.info("Forecast: predicted=%s trend=%s", fc["predicted_risk"], fc["trend"])

        # 3 – Decision
        decision = self.decision_agent.decide(risk)
        log.info("Decision: action=%s  urgency=%s", decision.action, decision.urgency)
        batch.append(self._make_log("Decision", f"Action: {decision.action} — Urgency: {decision.urgency}"))

        # 4 – Alert (only fires for ORANGE / RED)
        alert: Alert | None = self.alert_agent.evaluate(risk, decision)
        if alert:
            log.info("Alert: %s – %s", alert.severity, alert.title)
            batch.append(self._make_log("Alert", f"Alert dispatched: {alert.title}"))
        else:
            batch.append(self._make_log("Alert", "No alert — risk below threshold"))

        update = SSEUpdate(
            timestamp=datetime.utcnow().isoformat(),
            risk=risk,
            decision=decision,
            alert=alert,
            agent_logs=batch,
            forecast=forecast,
        )

        self.last_update = update
        return update

    def get_alerts(self, limit: int = 50) -> list[Alert]:
        return self.alert_agent.get_recent(limit)

    def get_agent_logs(self) -> list[AgentLog]:
        """Return agent logs in chronological order (oldest → newest)."""
        return list(self._agent_logs)

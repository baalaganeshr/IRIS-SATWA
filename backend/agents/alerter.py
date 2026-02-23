"""
Alert Agent – generates alerts for ORANGE / RED conditions and keeps history.
"""

from __future__ import annotations

from collections import deque
from datetime import datetime

from models.schemas import Alert, Decision, RiskAssessment
from config import MAX_ALERT_HISTORY

_TITLES: dict[str, str] = {
    "ORANGE": "Elevated Structural Risk Detected",
    "RED": "CRITICAL: Immediate Action Required",
}


class AlertAgent:
    """Stateful agent that maintains an in-memory alert history."""

    def __init__(self) -> None:
        self._history: deque[Alert] = deque(maxlen=MAX_ALERT_HISTORY)

    def evaluate(
        self, risk: RiskAssessment, decision: Decision
    ) -> Alert | None:
        """Return an Alert for ORANGE or RED levels; None otherwise."""
        if risk.risk_level not in ("ORANGE", "RED"):
            return None

        factors = ", ".join(risk.contributing_factors) if risk.contributing_factors else "multiple factors"
        message = (
            f"Risk score {risk.overall_score}/100. "
            f"Contributing factors: {factors}. "
            f"Action: {decision.action}."
        )

        alert = Alert(
            severity=risk.risk_level,
            title=_TITLES.get(risk.risk_level, "Alert"),
            message=message,
            timestamp=datetime.utcnow().isoformat(),
        )

        self._history.appendleft(alert)
        return alert

    def get_recent(self, limit: int = MAX_ALERT_HISTORY) -> list[Alert]:
        """Return recent alerts, most-recent first."""
        return list(self._history)[:limit]

    def clear(self) -> None:
        self._history.clear()

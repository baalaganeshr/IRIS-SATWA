"""
Decision Agent – maps risk levels to actionable response protocols.
"""

from __future__ import annotations

from models.schemas import Decision, RiskAssessment

# ── Protocol definitions ────────────────────────────────────────────────────

_PROTOCOLS: dict[str, dict] = {
    "GREEN": {
        "action": "MONITOR",
        "urgency": "low",
        "recommended_actions": [
            "Continue standard monitoring cycle",
            "Log sensor readings for trend analysis",
        ],
    },
    "YELLOW": {
        "action": "WARN",
        "urgency": "moderate",
        "recommended_actions": [
            "Increase monitoring frequency to 1-minute intervals",
            "Notify bridge maintenance crew",
            "Review recent sensor trend data",
            "Prepare inspection equipment",
        ],
    },
    "ORANGE": {
        "action": "RESTRICT",
        "urgency": "high",
        "recommended_actions": [
            "Reduce traffic to single lane",
            "Deploy bridge inspection team immediately",
            "Alert local authorities and emergency services",
            "Prepare detour routes for activation",
            "Set up on-site monitoring station",
        ],
    },
    "RED": {
        "action": "EVACUATE",
        "urgency": "critical",
        "recommended_actions": [
            "CLOSE BRIDGE IMMEDIATELY — all lanes",
            "Trigger emergency services (fire, ambulance, police)",
            "Activate all predetermined detour routes",
            "Deploy structural assessment team",
            "Notify city emergency management office",
            "Begin evacuation of nearby structures if applicable",
        ],
    },
}


class DecisionAgent:
    """Stateless agent that produces a Decision from a RiskAssessment."""

    def decide(self, risk: RiskAssessment) -> Decision:
        proto = _PROTOCOLS.get(risk.risk_level, _PROTOCOLS["GREEN"])
        justification = self._build_justification(risk)

        return Decision(
            action=proto["action"],
            urgency=proto["urgency"],
            recommended_actions=proto["recommended_actions"],
            justification=justification,
        )

    # ── internal ────────────────────────────────────────────────────────────

    @staticmethod
    def _build_justification(risk: RiskAssessment) -> str:
        parts: list[str] = [
            f"Overall risk score is {risk.overall_score}/100 ({risk.risk_level})."
        ]

        if risk.contributing_factors:
            factors_str = ", ".join(
                f.replace("_", " ").title() for f in risk.contributing_factors
            )
            parts.append(f"Primary contributing factors: {factors_str}.")

        bd = risk.breakdown
        details = []
        if bd.stress_score >= 0.5:
            details.append(f"structural stress at {bd.stress_score:.0%}")
        if bd.vibration_score >= 0.5:
            details.append(f"vibration at {bd.vibration_score:.0%}")
        if bd.load_score >= 0.5:
            details.append(f"traffic load at {bd.load_score:.0%}")
        if bd.environmental_score >= 0.5:
            details.append(f"environmental factors at {bd.environmental_score:.0%}")

        if details:
            parts.append("Elevated readings: " + ", ".join(details) + ".")

        if risk.risk_level == "RED":
            parts.append(
                "Immediate structural failure risk — execute emergency protocol."
            )
        elif risk.risk_level == "ORANGE":
            parts.append(
                "Conditions approaching dangerous levels — restrict access and inspect."
            )

        return " ".join(parts)

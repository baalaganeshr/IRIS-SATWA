"""
Risk Scoring Agent – computes a weighted risk score and maps it to a risk level.
"""

from __future__ import annotations

from models.schemas import NormalizedReading, RiskAssessment, SensorBreakdown
from config import COMPOUND_RULES, RISK_THRESHOLDS, RISK_WEIGHTS


class RiskScorerAgent:
    """Stateless rule-based risk evaluation."""

    def assess(self, readings: list[NormalizedReading]) -> RiskAssessment:
        scores = self._aggregate(readings)
        breakdown = SensorBreakdown(
            stress_score=round(scores.get("STRESS", 0.0), 4),
            vibration_score=round(scores.get("VIBRATION", 0.0), 4),
            load_score=round(scores.get("LOAD", 0.0), 4),
            environmental_score=round(scores.get("ENVIRONMENTAL", 0.0), 4),
        )

        weighted = (
            scores.get("STRESS", 0) * RISK_WEIGHTS["STRESS"]
            + scores.get("VIBRATION", 0) * RISK_WEIGHTS["VIBRATION"]
            + scores.get("LOAD", 0) * RISK_WEIGHTS["LOAD"]
            + scores.get("ENVIRONMENTAL", 0) * RISK_WEIGHTS["ENVIRONMENTAL"]
        )
        overall = int(min(100, max(0, round(weighted * 100))))

        risk_level = self._level_from_score(overall)

        # compound escalation
        forced_red = False
        forced_red_reason: str | None = None
        for rule in COMPOUND_RULES:
            if all(
                scores.get(k, 0) >= v for k, v in rule["conditions"].items()
            ):
                risk_level = rule["escalate_to"]
                overall = max(overall, 76)  # ensure score matches RED
                forced_red = True
                forced_red_reason = " AND ".join(
                    f"{k.lower()} >= {v}" for k, v in rule["conditions"].items()
                )
                break

        factors = [k for k, v in scores.items() if v >= 0.6 and k != "ENVIRONMENTAL"]
        if scores.get("ENVIRONMENTAL", 0) >= 0.6:
            factors.append("ENVIRONMENTAL")

        return RiskAssessment(
            overall_score=overall,
            risk_level=risk_level,
            breakdown=breakdown,
            contributing_factors=factors,
            forced_red=forced_red,
            forced_red_reason=forced_red_reason,
        )

    # ── helpers ─────────────────────────────────────────────────────────────

    @staticmethod
    def _aggregate(readings: list[NormalizedReading]) -> dict[str, float]:
        """Take the max normalised value per sensor type.  Combine TEMPERATURE
        and WIND into a single ENVIRONMENTAL score (max of the two)."""
        buckets: dict[str, float] = {}
        for r in readings:
            key = r.sensor_type
            buckets[key] = max(buckets.get(key, 0.0), r.normalized_value)

        env = max(buckets.pop("TEMPERATURE", 0.0), buckets.pop("WIND", 0.0))
        buckets["ENVIRONMENTAL"] = env
        return buckets

    @staticmethod
    def _level_from_score(score: int) -> str:
        for threshold, level in RISK_THRESHOLDS:
            if score <= threshold:
                return level
        return "RED"

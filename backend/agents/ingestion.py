"""
Ingestion Agent – validates, normalizes, and flags anomalies in raw sensor data.
"""

from __future__ import annotations

from models.schemas import NormalizedReading, SensorReading
from config import ANOMALY_THRESHOLD, SENSOR_RANGES


class IngestionAgent:
    """Stateless agent that transforms raw readings into normalized form."""

    def process(self, readings: list[SensorReading]) -> list[NormalizedReading]:
        return [self._normalize(r) for r in readings]

    # ── internal ────────────────────────────────────────────────────────────

    def _normalize(self, reading: SensorReading) -> NormalizedReading:
        lo, hi = SENSOR_RANGES.get(reading.sensor_type, (0.0, 1.0))
        span = hi - lo if hi != lo else 1.0
        norm = max(0.0, min(1.0, (reading.value - lo) / span))

        return NormalizedReading(
            sensor_id=reading.sensor_id,
            sensor_type=reading.sensor_type,
            raw_value=reading.value,
            normalized_value=round(norm, 4),
            unit=reading.unit,
            anomaly=norm >= ANOMALY_THRESHOLD,
            bridge_section=reading.bridge_section,
        )

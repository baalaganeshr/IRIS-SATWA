"""
IRIS – Bridge Structural Emergency Decision System
Configuration: thresholds, weights, constants.
"""

# ── Sensor value ranges (min, max) ──────────────────────────────────────────
SENSOR_RANGES: dict[str, tuple[float, float]] = {
    "STRESS": (0.0, 500.0),        # MPa
    "VIBRATION": (0.0, 50.0),      # mm/s
    "LOAD": (0.0, 100.0),          # tons
    "TEMPERATURE": (-20.0, 60.0),  # °C
    "WIND": (0.0, 200.0),          # km/h
}

# ── Risk scoring weights (must sum to 1.0) ──────────────────────────────────
RISK_WEIGHTS: dict[str, float] = {
    "STRESS": 0.35,
    "VIBRATION": 0.25,
    "LOAD": 0.20,
    "ENVIRONMENTAL": 0.20,  # combined temp + wind
}

# ── Risk level thresholds ───────────────────────────────────────────────────
RISK_THRESHOLDS: list[tuple[int, str]] = [
    (30, "GREEN"),
    (55, "YELLOW"),
    (75, "ORANGE"),
    (100, "RED"),
]

# ── Compound escalation rules ───────────────────────────────────────────────
# If ALL conditions in a rule are met, force-escalate to the given level.
COMPOUND_RULES: list[dict] = [
    {
        "conditions": {"STRESS": 0.80, "VIBRATION": 0.70},
        "escalate_to": "RED",
    },
    {
        "conditions": {"STRESS": 0.70, "LOAD": 0.80},
        "escalate_to": "RED",
    },
]

# ── Anomaly threshold (normalized) ─────────────────────────────────────────
ANOMALY_THRESHOLD: float = 0.95

# ── Alert / misc ────────────────────────────────────────────────────────────
MAX_ALERT_HISTORY: int = 50
SCENARIO_STEP_INTERVAL: float = 3.0  # seconds between scenario steps

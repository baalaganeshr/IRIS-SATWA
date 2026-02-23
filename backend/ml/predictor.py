"""
predictor.py — GRU-based risk forecaster.

Predicts risk score (0–100) from a 30-step sensor history.
Used for advisory forecasting only — emergency decisions remain rule-based.
"""

from __future__ import annotations

import logging
import os
from typing import Literal

import numpy as np
import torch
import torch.nn as nn

log = logging.getLogger("iris.ml.predictor")

SEQ_LEN = 30
FEATURES = 4
MODEL_PATH = os.path.join(os.path.dirname(__file__), "forecast_model.pt")


# ── GRU architecture ───────────────────────────────────────────────────────

class RiskGRU(nn.Module):
    """Minimal GRU for structural risk forecasting."""

    def __init__(self, input_size: int = FEATURES, hidden_size: int = 32, num_layers: int = 1):
        super().__init__()
        self.gru = nn.GRU(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, features)
        _, h_n = self.gru(x)          # h_n: (layers, batch, hidden)
        out = self.fc(h_n[-1])        # (batch, 1)
        return self.sigmoid(out) * 100.0  # scale to 0-100


# ── Forecaster API ──────────────────────────────────────────────────────────

Trend = Literal["rising", "stable", "falling"]


class RiskForecaster:
    """
    Loads a trained GRU model and produces risk forecasts from sensor history.
    Falls back to a simple heuristic if no model file exists.
    """

    def __init__(self) -> None:
        self.model: RiskGRU | None = None
        self._load_model()

    def _load_model(self) -> None:
        if not os.path.exists(MODEL_PATH):
            log.warning("No forecast model found at %s — using heuristic fallback", MODEL_PATH)
            return
        try:
            self.model = RiskGRU()
            self.model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu", weights_only=True))
            self.model.eval()
            log.info("Forecast model loaded from %s", MODEL_PATH)
        except Exception as exc:
            log.error("Failed to load forecast model: %s", exc)
            self.model = None

    MIN_ENTRIES = 10  # minimum readings before forecasting

    def predict(self, sequence: list[list[float]]) -> float:
        """
        Predict risk score from a sequence of sensor vectors.
        sequence: list of vectors, each [stress, vibration, load, environmental] (0-1).
        If fewer than SEQ_LEN (30) entries, pads by repeating the earliest entry.
        Returns: predicted risk 0-100, or -1 if not enough data.
        """
        if len(sequence) < self.MIN_ENTRIES:
            return -1.0  # not enough data

        recent = list(sequence[-SEQ_LEN:])  # take up to last 30
        # Pad to SEQ_LEN if fewer entries available
        while len(recent) < SEQ_LEN:
            recent.insert(0, recent[0])

        if self.model is not None:
            with torch.no_grad():
                tensor = torch.tensor([recent], dtype=torch.float32)  # (1, 30, 4)
                pred = self.model(tensor).item()
                return round(min(100.0, max(0.0, pred)), 1)

        # Heuristic fallback: weighted average of last 5 readings
        weights = np.array([0.35, 0.25, 0.20, 0.20])
        last5 = np.array(recent[-5:])
        scores = np.dot(last5, weights) * 100
        return round(float(np.clip(np.mean(scores) * 1.05, 0, 100)), 1)

    def forecast_trend(self, sequence: list[list[float]], current_risk: float) -> dict:
        """
        Return forecast dict with predicted_risk, trend, and confidence.
        """
        predicted = self.predict(sequence)

        if predicted < 0:
            return {"predicted_risk": None, "trend": None}

        delta = predicted - current_risk

        if delta > 5:
            trend: Trend = "rising"
        elif delta < -5:
            trend = "falling"
        else:
            trend = "stable"

        return {
            "predicted_risk": predicted,
            "trend": trend,
        }

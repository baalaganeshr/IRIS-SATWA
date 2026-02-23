"""
trainer.py — Generates synthetic structural sensor data and trains a small GRU
model that predicts risk score 5 minutes ahead from a 30-step history window.

Trained on synthetic structural scenarios for demo purposes.
"""

from __future__ import annotations

import math
import os
import random

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

from ml.predictor import RiskGRU

# ── Config ──────────────────────────────────────────────────────────────────

SEQ_LEN = 30       # 30 timesteps of history (~60s at 2s interval)
FEATURES = 4       # stress, vibration, load, environmental
EPOCHS = 20
BATCH = 64
LR = 1e-3
MODEL_PATH = os.path.join(os.path.dirname(__file__), "forecast_model.pt")
SAMPLES = 3000


# ── Synthetic data generator ────────────────────────────────────────────────

def _risk_score(v: np.ndarray) -> float:
    """Weighted score matching the rule-based engine."""
    weights = np.array([0.35, 0.25, 0.20, 0.20])
    return float(np.clip(np.dot(v, weights) * 100, 0, 100))


def generate_dataset() -> tuple[np.ndarray, np.ndarray]:
    """
    Return X (SAMPLES, SEQ_LEN, 4) and y (SAMPLES,) where y is the risk score
    at the step *after* the sequence (forecasting target).
    """
    X_all, y_all = [], []

    for _ in range(SAMPLES):
        pattern = random.choice(["normal", "storm", "critical", "mixed"])
        seq = np.zeros((SEQ_LEN + 1, FEATURES), dtype=np.float32)

        if pattern == "normal":
            base = np.array([0.1, 0.1, 0.15, 0.1], dtype=np.float32)
            for t in range(SEQ_LEN + 1):
                noise = np.random.normal(0, 0.03, FEATURES).astype(np.float32)
                seq[t] = np.clip(base + noise, 0, 1)

        elif pattern == "storm":
            for t in range(SEQ_LEN + 1):
                progress = t / SEQ_LEN
                stress = 0.15 + 0.3 * progress + np.random.normal(0, 0.04)
                vibration = 0.1 + 0.45 * progress + np.random.normal(0, 0.05)
                load = 0.2 + 0.15 * progress + np.random.normal(0, 0.03)
                env = 0.15 + 0.55 * progress + np.random.normal(0, 0.06)
                seq[t] = np.clip([stress, vibration, load, env], 0, 1)

        elif pattern == "critical":
            spike_start = random.randint(SEQ_LEN // 3, SEQ_LEN - 5)
            for t in range(SEQ_LEN + 1):
                if t < spike_start:
                    base = np.array([0.3, 0.25, 0.2, 0.3]) + np.random.normal(0, 0.04, FEATURES)
                else:
                    ramp = (t - spike_start) / max(1, (SEQ_LEN - spike_start))
                    base = np.array([0.3 + 0.6 * ramp, 0.25 + 0.55 * ramp,
                                     0.2 + 0.4 * ramp, 0.3 + 0.5 * ramp])
                    base += np.random.normal(0, 0.05, FEATURES)
                seq[t] = np.clip(base, 0, 1).astype(np.float32)

        else:  # mixed — sinusoidal fluctuations
            for t in range(SEQ_LEN + 1):
                phase = random.uniform(0, 2 * math.pi)
                amp = random.uniform(0.1, 0.35)
                base = 0.3 + amp * math.sin(2 * math.pi * t / SEQ_LEN + phase)
                seq[t] = np.clip(
                    np.array([base, base * 0.9, base * 0.7, base * 1.1])
                    + np.random.normal(0, 0.04, FEATURES),
                    0, 1,
                ).astype(np.float32)

        X_all.append(seq[:SEQ_LEN])
        y_all.append(_risk_score(seq[SEQ_LEN]))

    return np.array(X_all, dtype=np.float32), np.array(y_all, dtype=np.float32)


# ── Training loop ───────────────────────────────────────────────────────────

def train_model() -> str:
    """Train the GRU forecaster and save to MODEL_PATH. Returns path."""
    print(f"[trainer] Generating {SAMPLES} synthetic sequences …")
    X, y = generate_dataset()

    # Normalize target to 0-1 for sigmoid output
    y_norm = y / 100.0

    dataset = TensorDataset(torch.from_numpy(X), torch.from_numpy(y_norm))
    loader = DataLoader(dataset, batch_size=BATCH, shuffle=True)

    model = RiskGRU()
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.MSELoss()

    model.train()
    for epoch in range(1, EPOCHS + 1):
        total_loss = 0.0
        for xb, yb in loader:
            optimizer.zero_grad()
            pred = model(xb).squeeze(-1)
            loss = criterion(pred, yb)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * xb.size(0)
        avg = total_loss / len(dataset)
        if epoch % 5 == 0 or epoch == 1:
            print(f"  epoch {epoch:>2}/{EPOCHS}  loss={avg:.6f}")

    torch.save(model.state_dict(), MODEL_PATH)
    print(f"[trainer] Model saved → {MODEL_PATH}")
    return MODEL_PATH


if __name__ == "__main__":
    train_model()

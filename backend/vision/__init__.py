"""
Vision analysis module — multi-signal heuristic for structural damage detection.
Combines edge density, texture roughness, color anomaly, and contrast analysis
to produce a crack/damage confidence score.

Structured so it can be swapped to a pretrained crack-detection model later.
"""

from __future__ import annotations

import base64
import io
import logging
from abc import ABC, abstractmethod

log = logging.getLogger("iris.vision")


class BaseCrackDetector(ABC):
    """Interface every crack detector must implement."""

    @abstractmethod
    def analyze(self, image_bytes: bytes) -> dict:
        """Return { crack_confidence: float, note: str, overlay_image_base64?: str }."""
        ...


class MultiSignalDamageDetector(BaseCrackDetector):
    """
    Multi-signal heuristic that combines several image features to estimate
    structural damage confidence.  No GPU required.

    Signals combined (weighted):
      1. Edge density   — ratio of strong edge pixels (cracks = many edges)
      2. Edge energy     — variance of edge map (damage = chaotic edges)
      3. Texture entropy — local intensity variance (damage = rough texture)
      4. Color anomaly   — deviation in colour channels (rust, exposed concrete)
      5. Contrast ratio  — local contrast extremes (breaks in surface)
    """

    # ── tuneable knobs ──────────────────────────────────────────────
    WEIGHTS = {
        "edge_density": 0.22,
        "edge_energy":  0.18,
        "texture":      0.20,
        "color":        0.15,
        "contrast":     0.18,
        "disorder":     0.07,   # NEW: spatial disorder of edges
    }
    SIZE = (384, 384)          # analysis resolution
    EDGE_THRESHOLD = 0.06      # lowered — catch finer cracks
    TEXTURE_BLOCK = 12         # smaller blocks = finer texture detail
    # ────────────────────────────────────────────────────────────────

    def analyze(self, image_bytes: bytes) -> dict:
        try:
            import numpy as np
            from PIL import Image, ImageFilter

            raw = Image.open(io.BytesIO(image_bytes))
            grey = raw.convert("L").resize(self.SIZE)
            colour = raw.convert("RGB").resize(self.SIZE)

            scores: dict[str, float] = {}

            # --- 1. Edge density (proportion of strong edge pixels) ----------
            edges = grey.filter(ImageFilter.FIND_EDGES)
            edge_arr = np.asarray(edges, dtype=np.float32) / 255.0
            strong = (edge_arr > self.EDGE_THRESHOLD).astype(np.float32)
            density = float(strong.mean())
            # Aggressive sigmoid: 8 % edges ≈ 0.5, 15 % ≈ 0.9
            scores["edge_density"] = float(min(1.0, 1.0 / (1.0 + np.exp(-25 * (density - 0.08)))))

            # --- 2. Edge energy (variance of edge map) -----------------------
            energy = float(edge_arr.var())
            # More sensitive: var 0.008 ≈ calm, var 0.025+ ≈ severe
            scores["edge_energy"] = float(min(1.0, energy / 0.020))

            # --- 3. Texture roughness (mean local std-dev in NxN blocks) -----
            g = np.asarray(grey, dtype=np.float32) / 255.0
            b = self.TEXTURE_BLOCK
            h, w = g.shape
            local_stds = []
            for y in range(0, h - b + 1, b):
                for x in range(0, w - b + 1, b):
                    patch = g[y:y+b, x:x+b]
                    local_stds.append(float(patch.std()))
            mean_local_std = float(np.mean(local_stds)) if local_stds else 0.0
            # Also measure the proportion of "rough" blocks (std > 0.08)
            rough_ratio = float(np.mean([1.0 if s > 0.08 else 0.0 for s in local_stds])) if local_stds else 0.0
            # Combined texture score
            scores["texture"] = float(min(1.0, (mean_local_std / 0.10) * 0.6 + rough_ratio * 0.6))

            # --- 4. Colour anomaly (saturation spread + brown/rust + grey variance) ---
            c_arr = np.asarray(colour, dtype=np.float32)
            r, gr, bl = c_arr[:,:,0], c_arr[:,:,1], c_arr[:,:,2]
            # Channel spread — cracks expose different-coloured material
            spread = float(np.std([r.mean(), gr.mean(), bl.mean()]) / 100.0)
            # Rust/earth tone detector: R > G > B
            rust_mask = ((r > gr + 10) & (gr > bl + 3)).astype(np.float32)
            rust_ratio = float(rust_mask.mean())
            # Dark region detector (shadow in cracks/gaps): pixels < 60 brightness
            lum = (0.299 * r + 0.587 * gr + 0.114 * bl)
            dark_ratio = float((lum < 60).astype(np.float32).mean())
            scores["color"] = float(min(1.0, spread * 3.0 + rust_ratio * 3.5 + dark_ratio * 2.0))

            # --- 5. Contrast ratio (P95 – P5 of luminance in blocks) --------
            contrasts = []
            for y in range(0, h - b + 1, b):
                for x in range(0, w - b + 1, b):
                    patch = g[y:y+b, x:x+b].flatten()
                    c = float(np.percentile(patch, 95) - np.percentile(patch, 5))
                    contrasts.append(c)
            mean_contrast = float(np.mean(contrasts)) if contrasts else 0.0
            # High-contrast block ratio (blocks where P95-P5 > 0.3)
            hi_contrast_ratio = float(np.mean([1.0 if c > 0.3 else 0.0 for c in contrasts])) if contrasts else 0.0
            scores["contrast"] = float(min(1.0, (mean_contrast / 0.40) * 0.5 + hi_contrast_ratio * 0.7))

            # --- 6. Spatial disorder (edge distribution non-uniformity) ------
            # Damaged surfaces have edges scattered everywhere, not just along
            # a few organised lines.  Measure how many grid cells have edges.
            cell = 24
            cells_with_edges = 0
            total_cells = 0
            for y in range(0, h - cell + 1, cell):
                for x in range(0, w - cell + 1, cell):
                    total_cells += 1
                    if float(strong[y:y+cell, x:x+cell].mean()) > 0.04:
                        cells_with_edges += 1
            spread_ratio = cells_with_edges / max(total_cells, 1)
            scores["disorder"] = float(min(1.0, spread_ratio / 0.55))

            # ── weighted combination ─────────────────────────────────
            raw_conf = sum(self.WEIGHTS[k] * scores[k] for k in self.WEIGHTS)

            # ── synergy boost: when multiple signals agree, amplify ──
            # Count how many signals are individually above 0.5
            firing = sum(1 for v in scores.values() if v > 0.5)
            # If 4+ signals fire → strong synergy, 3 → moderate
            if firing >= 5:
                synergy = 0.18
            elif firing >= 4:
                synergy = 0.12
            elif firing >= 3:
                synergy = 0.06
            else:
                synergy = 0.0

            confidence = raw_conf + synergy
            # Power curve: compresses low scores, expands mid-high
            # x^0.8 when x > 0.25 (push damaged images up),
            # x*0.6  when x < 0.15 (suppress clean images floor noise)
            if confidence < 0.15:
                confidence = confidence * 0.55
            else:
                confidence = confidence ** 0.82
            confidence = float(min(1.0, max(0.0, confidence)))

            # Build the heat-map overlay
            overlay_b64 = self._make_overlay(image_bytes, edge_arr, strong)

            # Descriptive note
            if confidence >= 0.75:
                note = "Severe structural damage detected — immediate inspection recommended."
            elif confidence >= 0.50:
                note = "Moderate damage indicators — schedule follow-up inspection."
            elif confidence >= 0.30:
                note = "Mild surface irregularities detected — monitor periodically."
            else:
                note = "Surface appears mostly intact — no significant damage."

            detail = ", ".join(f"{k}={v:.2f}" for k, v in scores.items())
            log.info("Vision analysis: conf=%.4f  signals=[%s]", confidence, detail)

            return {
                "crack_confidence": round(confidence, 4),
                "note": note,
                "overlay_image_base64": overlay_b64,
            }

        except ImportError:
            log.warning("Pillow / numpy not available — returning random heuristic.")
            import random
            conf = round(random.uniform(0.05, 0.85), 4)
            return {
                "crack_confidence": conf,
                "note": "Pillow not installed — random placeholder confidence.",
                "overlay_image_base64": None,
            }

    @staticmethod
    def _make_overlay(
        original_bytes: bytes,
        edge_arr: "np.ndarray",
        strong_mask: "np.ndarray",
    ) -> str | None:
        """
        Build a heat-map overlay:
          - Green  for mild edge regions
          - Yellow for moderate
          - Red    for strong / likely damage
        """
        try:
            from PIL import Image
            import numpy as np

            size = (edge_arr.shape[1], edge_arr.shape[0])
            orig = Image.open(io.BytesIO(original_bytes)).convert("RGB").resize(size)
            orig_arr = np.asarray(orig, dtype=np.float32)

            # Normalise edge intensity 0-1
            ei = edge_arr / (edge_arr.max() + 1e-6)

            overlay = orig_arr.copy()

            # Mild edges (0.05 – 0.25):  subtle green tint
            mild = ((ei > 0.05) & (ei <= 0.25)).astype(np.float32)
            overlay[:, :, 1] = np.clip(overlay[:, :, 1] + mild * 60, 0, 255)

            # Moderate (0.25 – 0.5):  yellow / orange tint
            mod = ((ei > 0.25) & (ei <= 0.50)).astype(np.float32)
            overlay[:, :, 0] = np.clip(overlay[:, :, 0] + mod * 140, 0, 255)
            overlay[:, :, 1] = np.clip(overlay[:, :, 1] + mod * 80, 0, 255)
            overlay[:, :, 2] = overlay[:, :, 2] * (1 - mod * 0.6)

            # Strong (> 0.5):  red highlight
            severe = (ei > 0.50).astype(np.float32)
            overlay[:, :, 0] = np.clip(overlay[:, :, 0] + severe * 200, 0, 255)
            overlay[:, :, 1] = overlay[:, :, 1] * (1 - severe * 0.7)
            overlay[:, :, 2] = overlay[:, :, 2] * (1 - severe * 0.7)

            result = Image.fromarray(overlay.astype(np.uint8))
            buf = io.BytesIO()
            result.save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode("ascii")
        except Exception:
            return None


# Default detector instance (swap this for a real model later)
detector: BaseCrackDetector = MultiSignalDamageDetector()


def analyze_image(image_bytes: bytes) -> dict:
    """Public API — delegates to whichever detector is active."""
    return detector.analyze(image_bytes)

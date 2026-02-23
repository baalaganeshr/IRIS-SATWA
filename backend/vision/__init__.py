"""
Vision analysis module — placeholder heuristic (edge-density based).
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


class EdgeDensityDetector(BaseCrackDetector):
    """
    Fast heuristic: uses Sobel/Canny edge density as a proxy for crack presence.
    No GPU required — good enough for a hackathon demo.
    """

    def analyze(self, image_bytes: bytes) -> dict:
        try:
            import numpy as np
            from PIL import Image, ImageFilter

            img = Image.open(io.BytesIO(image_bytes)).convert("L")
            # resize for speed
            img = img.resize((256, 256))

            # Canny-like: find edges via a high-pass kernel
            edges = img.filter(ImageFilter.FIND_EDGES)
            arr = np.asarray(edges, dtype=np.float32) / 255.0

            # Edge density → confidence (tuned so typical photos ~ 0.1–0.3, cracked ~ 0.5–0.9)
            density = float(arr.mean())
            confidence = min(1.0, density * 4.0)  # scale up

            # Build a simple red-overlay preview
            overlay_b64 = self._make_overlay(image_bytes, edges)

            note = (
                "High edge density detected — possible surface cracking."
                if confidence > 0.45
                else "Surface appears mostly intact."
            )

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
    def _make_overlay(original_bytes: bytes, edges_img) -> str | None:
        """Composite red-highlighted edges over the original image."""
        try:
            from PIL import Image
            import numpy as np

            orig = Image.open(io.BytesIO(original_bytes)).convert("RGB").resize((256, 256))
            orig_arr = np.asarray(orig, dtype=np.float32)

            edge_arr = np.asarray(edges_img, dtype=np.float32) / 255.0
            mask = (edge_arr > 0.15).astype(np.float32)

            # Red overlay where edges are strong
            overlay = orig_arr.copy()
            overlay[:, :, 0] = np.clip(overlay[:, :, 0] + mask * 180, 0, 255)
            overlay[:, :, 1] = overlay[:, :, 1] * (1 - mask * 0.5)
            overlay[:, :, 2] = overlay[:, :, 2] * (1 - mask * 0.5)

            result = Image.fromarray(overlay.astype(np.uint8))
            buf = io.BytesIO()
            result.save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode("ascii")
        except Exception:
            return None


# Default detector instance (swap this for a real model later)
detector: BaseCrackDetector = EdgeDensityDetector()


def analyze_image(image_bytes: bytes) -> dict:
    """Public API — delegates to whichever detector is active."""
    return detector.analyze(image_bytes)

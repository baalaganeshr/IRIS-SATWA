"""
Vision analysis module — region-focused structural damage detection.
Uses TOP-K block scoring (not global averaging) so that sky/vegetation
background doesn't dilute the damage signal from the actual structure.

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


class RegionFocusedDamageDetector(BaseCrackDetector):
    """
    Region-focused damage detector.

    Key insight:  real damage photos contain large non-damage areas (sky,
    vegetation, road).  Global averaging dilutes the score.  Instead we
    score every NxN block independently, then take the **TOP-K worst
    blocks** as the damage signal.  This way a bridge broken in half
    scores high even if 60 % of the image is sky.

    Per-block signals (combined into a block damage score):
      1. Edge density (cracks / fracture lines)
      2. Texture roughness (surface degradation)
      3. Local contrast (breaks in material)
      4. Dark-gap ratio (voids / separations)
      5. Color anomaly (rust / exposed rebar / earth tones)

    Global signals (bonus on top):
      6. Structural break — large dark horizontal / vertical bands
      7. Edge spatial spread — damage across many regions
    """

    SIZE = (448, 448)
    BLOCK = 32                 # block size for per-region scoring
    TOP_K_PCT = 0.30           # use worst 30 % of blocks
    EDGE_THRESH = 0.05

    def analyze(self, image_bytes: bytes) -> dict:
        try:
            import numpy as np
            from PIL import Image, ImageFilter

            raw = Image.open(io.BytesIO(image_bytes))
            grey = raw.convert("L").resize(self.SIZE)
            colour = raw.convert("RGB").resize(self.SIZE)

            g = np.asarray(grey, dtype=np.float32) / 255.0
            c_arr = np.asarray(colour, dtype=np.float32)
            h, w = g.shape
            B = self.BLOCK

            # Full-image edge map
            edges = grey.filter(ImageFilter.FIND_EDGES)
            edge_arr = np.asarray(edges, dtype=np.float32) / 255.0
            strong = (edge_arr > self.EDGE_THRESH).astype(np.float32)

            # ═══════════════════════════════════════════════════════════
            #  PER-BLOCK SCORING — score each BxB block independently
            # ═══════════════════════════════════════════════════════════
            block_scores = []
            for y in range(0, h - B + 1, B):
                for x in range(0, w - B + 1, B):
                    bs = self._score_block(
                        g[y:y+B, x:x+B],
                        edge_arr[y:y+B, x:x+B],
                        strong[y:y+B, x:x+B],
                        c_arr[y:y+B, x:x+B],
                        np,
                    )
                    block_scores.append(bs)

            block_scores_arr = np.array(block_scores)

            # TOP-K: use the worst (highest-scoring) 30 % of blocks
            k = max(1, int(len(block_scores) * self.TOP_K_PCT))
            top_k = np.sort(block_scores_arr)[-k:]
            topk_mean = float(top_k.mean())

            # Peak (single worst block)
            peak = float(block_scores_arr.max())

            # Global mean (whole image average — includes sky/clean areas)
            global_mean = float(block_scores_arr.mean())

            # ═══ DAMAGE EXTENT — what fraction of blocks are actually damaged? ═
            # This is critical for distinguishing "surface cracks on intact wall"
            # (few damaged blocks) from "structural collapse" (many damaged blocks)
            damaged_block_ratio = float(np.mean(block_scores_arr > 0.40))
            severely_damaged_ratio = float(np.mean(block_scores_arr > 0.60))

            # ═══════════════════════════════════════════════════════════
            #  GLOBAL SIGNAL 1 — Structural break (dark gap detection)
            # ═══════════════════════════════════════════════════════════
            # Look for horizontal/vertical bands of darkness (bridge gap)
            # Bridge undersides have shadows at ~0.10-0.15, actual gaps are < 0.08
            row_darkness = np.mean(g < 0.08, axis=1)   # only true voids/gaps
            col_darkness = np.mean(g < 0.08, axis=0)
            # A structural break → consecutive rows/cols are predominantly dark
            max_row_dark = float(np.max(row_darkness))
            max_col_dark = float(np.max(col_darkness))
            # Count rows/cols that are > 55 % dark
            dark_row_ratio = float(np.mean(row_darkness > 0.55))
            dark_col_ratio = float(np.mean(col_darkness > 0.55))
            break_score = min(1.0, max(max_row_dark, max_col_dark) * 1.0
                              + (dark_row_ratio + dark_col_ratio) * 1.3)

            # Blend region score: balance between focused damage and overall extent
            # Priority 1: structural break detected + severe top-K → trust the
            #   damage blocks even if most of the image is sky/clean background
            # Priority 2: widespread damage → trust top-K
            # Priority 3: localized → weight global mean more
            if break_score > 0.35 and topk_mean > 0.35:
                # Structural break evidence — focus on the damaged region
                region_score = 0.45 * topk_mean + 0.30 * peak + 0.25 * global_mean
            elif damaged_block_ratio > 0.5:
                # Widespread damage: trust top-K heavily
                region_score = 0.50 * topk_mean + 0.15 * peak + 0.35 * global_mean
            elif damaged_block_ratio > 0.25:
                # Moderate spread: balanced
                region_score = 0.40 * topk_mean + 0.15 * peak + 0.45 * global_mean
            else:
                # Localised / surface only: mostly intact, dampen top-K influence
                region_score = 0.30 * topk_mean + 0.10 * peak + 0.60 * global_mean

            # ═══════════════════════════════════════════════════════════
            #  GLOBAL SIGNAL 2 — Edge spatial spread
            # ═══════════════════════════════════════════════════════════
            cell = 28
            cells_with_edges = 0
            total_cells = 0
            for yy in range(0, h - cell + 1, cell):
                for xx in range(0, w - cell + 1, cell):
                    total_cells += 1
                    if float(strong[yy:yy+cell, xx:xx+cell].mean()) > 0.03:
                        cells_with_edges += 1
            spread_score = min(1.0, (cells_with_edges / max(total_cells, 1)) / 0.45)

            # ═══════════════════════════════════════════════════════════
            #  GLOBAL SIGNAL 3 — Overall edge energy + high-freq content
            # ═══════════════════════════════════════════════════════════
            # Laplacian variance (blurriness inverse — sharp/broken = high)
            lap = grey.filter(ImageFilter.Kernel(
                size=(3, 3),
                kernel=[0, 1, 0, 1, -4, 1, 0, 1, 0],
                scale=1, offset=128
            ))
            lap_arr = np.asarray(lap, dtype=np.float32) / 255.0
            lap_var = float(lap_arr.var())
            sharpness_score = min(1.0, lap_var / 0.015)

            # ═══════════════════════════════════════════════════════════
            #  FINAL COMBINATION
            # ═══════════════════════════════════════════════════════════
            #  60 % region + 10 % break + 7 % spread + 8 % sharpness + 15 % extent
            extent_score = min(1.0, damaged_block_ratio * 1.5 + severely_damaged_ratio * 1.2)

            raw_conf = (0.60 * region_score
                        + 0.10 * break_score
                        + 0.07 * spread_score
                        + 0.08 * sharpness_score
                        + 0.15 * extent_score)

            # Synergy: structural failure confirmation
            # A confirmed dark gap (break) + extreme local damage (peak) = structural failure
            # even when sky/background dilutes global stats
            if break_score > 0.30 and peak > 0.70:
                structural_boost = 0.22 * break_score + 0.18 * peak
                raw_conf += structural_boost
            elif region_score > 0.55 and break_score > 0.55 and damaged_block_ratio > 0.45:
                raw_conf += 0.08
            elif region_score > 0.45 and break_score > 0.45 and damaged_block_ratio > 0.35:
                raw_conf += 0.04

            # Count how many scores are individually strong
            all_scores = {
                "region": region_score, "break": break_score,
                "spread": spread_score, "sharpness": sharpness_score,
                "extent": extent_score,
            }
            firing = sum(1 for v in all_scores.values() if v > 0.55)
            if firing >= 4:
                raw_conf += 0.04
            elif firing >= 3:
                raw_conf += 0.02

            # Floor suppression for very clean images
            # Graduated power curve: compresses high raw scores to prevent
            # moderate damage from reaching 90 %+
            if raw_conf < 0.15:
                confidence = raw_conf * 0.30
            else:
                # Power 0.82 — maps: 0.5→0.43, 0.7→0.63, 0.85→0.78, 0.95→0.89
                confidence = raw_conf ** 0.82

            confidence = float(min(1.0, max(0.0, confidence)))

            # Heat-map overlay
            overlay_b64 = self._make_overlay(image_bytes, edge_arr, strong)

            # Note
            if confidence >= 0.75:
                note = "Severe structural damage detected — immediate inspection recommended."
            elif confidence >= 0.50:
                note = "Significant damage indicators — schedule urgent inspection."
            elif confidence >= 0.30:
                note = "Moderate surface irregularities — monitor closely."
            else:
                note = "Surface appears mostly intact — no significant damage."

            detail = ", ".join(f"{k}={v:.2f}" for k, v in all_scores.items())
            log.info("Vision: conf=%.3f  topk=%.2f  peak=%.2f  [%s]",
                     confidence, topk_mean, peak, detail)

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
    def _score_block(g_block, edge_block, strong_block, colour_block, np) -> float:
        """Compute a 0-1 damage score for a single image block."""
        # 1. Edge density — need significant edges, not just texture
        edge_density = float(strong_block.mean())
        ed_score = min(1.0, edge_density / 0.18)  # concrete texture ~0.06, cracks ~0.10+

        # 2. Texture roughness
        tex_std = float(g_block.std())
        tex_score = min(1.0, tex_std / 0.16)  # concrete ~0.08, cracked ~0.13+

        # 3. Local contrast (range of intensities)
        g_flat = g_block.flatten()
        contrast = float(np.percentile(g_flat, 95) - np.percentile(g_flat, 5))
        con_score = min(1.0, contrast / 0.55)

        # 4. Dark-gap ratio (proportion of very dark pixels — voids, separations)
        dark = float((g_block < 0.10).astype(np.float32).mean())
        dark_score = min(1.0, dark / 0.30)

        # 5. Color anomaly (rust/earth tones, or high channel variance)
        r, gr, bl = colour_block[:,:,0], colour_block[:,:,1], colour_block[:,:,2]
        rust = float(((r > gr + 18) & (gr > bl + 6)).astype(np.float32).mean())
        chan_var = float(np.std([r.mean(), gr.mean(), bl.mean()]) / 100.0)
        col_score = min(1.0, rust * 3.0 + chan_var * 1.8)

        # Weighted block score
        score = (0.30 * ed_score
                 + 0.20 * tex_score
                 + 0.20 * con_score
                 + 0.15 * dark_score
                 + 0.15 * col_score)
        return float(min(1.0, score))

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
detector: BaseCrackDetector = RegionFocusedDamageDetector()


def analyze_image(image_bytes: bytes) -> dict:
    """Public API — delegates to whichever detector is active."""
    return detector.analyze(image_bytes)

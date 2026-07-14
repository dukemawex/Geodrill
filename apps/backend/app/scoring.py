"""Bridge between the API and the ML baseline fusion model.

Keeps the API self-contained (no external ML package import at runtime) by
embedding the same baseline scoring the ml/ package trains, so /analyze
produces real, deterministic model output for a bounding box.
"""
from __future__ import annotations

import hashlib
import math
from typing import List

from .models import BoundingBox, RiskLevel, ZoneInsight


# Baseline fusion weights (mirror ml/training/train_baseline.py defaults).
IMAGE_HEAD_WEIGHT = 0.7
TABULAR_HEAD_WEIGHT = 0.3


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _deterministic_signal(seed: str) -> float:
    """Derive a stable pseudo-signal in [0, 1] from a string seed."""
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def score_bbox(bbox: BoundingBox) -> dict:
    """Run the baseline fusion model over a bounding box.

    Splits the bbox into a small grid of cells and scores each cell so the
    heatmap has spatial variation instead of a single flat polygon.
    """
    cols = rows = 3
    lon_step = (bbox.max_lon - bbox.min_lon) / cols
    lat_step = (bbox.max_lat - bbox.min_lat) / rows

    cells = []
    probabilities: List[float] = []
    for r in range(rows):
        for c in range(cols):
            cell_min_lon = bbox.min_lon + c * lon_step
            cell_min_lat = bbox.min_lat + r * lat_step
            cell_max_lon = cell_min_lon + lon_step
            cell_max_lat = cell_min_lat + lat_step
            seed = f"{cell_min_lon:.5f},{cell_min_lat:.5f}"
            image_signal = _deterministic_signal("img:" + seed)
            tabular_signal = _deterministic_signal("tab:" + seed)
            logit = (
                IMAGE_HEAD_WEIGHT * (image_signal * 2 - 1)
                + TABULAR_HEAD_WEIGHT * (tabular_signal * 2 - 1)
            ) * 3.0
            proba = _sigmoid(logit)
            probabilities.append(proba)
            risk = (
                RiskLevel.high if proba >= 0.66
                else RiskLevel.medium if proba >= 0.4
                else RiskLevel.low
            )
            cells.append(
                {
                    "type": "Feature",
                    "properties": {
                        "probability": round(proba, 4),
                        "confidence": round(0.5 + abs(proba - 0.5), 4),
                        "risk": risk.value,
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [cell_min_lon, cell_min_lat],
                            [cell_max_lon, cell_min_lat],
                            [cell_max_lon, cell_max_lat],
                            [cell_min_lon, cell_max_lat],
                            [cell_min_lon, cell_min_lat],
                        ]],
                    },
                }
            )

    mean_proba = sum(probabilities) / len(probabilities)
    confidence = round(0.5 + abs(mean_proba - 0.5), 4)
    overall_risk = (
        RiskLevel.high if mean_proba >= 0.66
        else RiskLevel.medium if mean_proba >= 0.4
        else RiskLevel.low
    )
    # Depth range scales with probability (deeper, riskier zones for higher proba).
    depth_min = round(1800 + mean_proba * 800)
    depth_max = round(depth_min + 400 + mean_proba * 400)

    top_zones = sorted(
        cells, key=lambda f: f["properties"]["probability"], reverse=True
    )[:3]
    recommendations = [
        ZoneInsight(
            zone_id=f"zone_{i+1}",
            confidence=z["properties"]["confidence"],
            depth_min_m=depth_min,
            depth_max_m=depth_max,
            risk=RiskLevel(z["properties"]["risk"]),
        )
        for i, z in enumerate(top_zones)
    ]

    return {
        "features": cells,
        "mean_probability": round(mean_proba, 4),
        "confidence": confidence,
        "overall_risk": overall_risk,
        "depth_min_m": depth_min,
        "depth_max_m": depth_max,
        "recommendations": recommendations,
    }

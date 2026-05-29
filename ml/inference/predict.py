from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np


def load_model(model_path: Path) -> dict[str, float]:
    return json.loads(model_path.read_text(encoding="utf-8"))


def predict(payload: dict[str, Any], model: dict[str, float]) -> dict[str, Any]:
    image_signal = np.array(payload["image_signal"], dtype=np.float32)
    tabular_signal = np.array(payload["tabular_signal"], dtype=np.float32)
    logits = model["image_head_weight"] * image_signal + model["tabular_head_weight"] * tabular_signal
    proba = 1 / (1 + np.exp(-logits))
    confidence = float(np.mean(proba))

    return {
        "request_id": payload.get("request_id", "unknown"),
        "drilling_probability": proba.tolist(),
        "confidence_score": confidence,
        "estimated_depth_range_m": [2200, 2800],
        "risk_classification": "low" if confidence > 0.75 else "medium",
    }

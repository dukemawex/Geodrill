from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np


@dataclass
class TrainConfig:
    epochs: int = 3
    learning_rate: float = 1e-3


class BaselineFusionModel:
    def __init__(self) -> None:
        self.image_head_weight = np.array([0.7], dtype=np.float32)
        self.tabular_head_weight = np.array([0.3], dtype=np.float32)

    def predict_proba(self, image_signal: np.ndarray, tabular_signal: np.ndarray) -> np.ndarray:
        score = self.image_head_weight * image_signal + self.tabular_head_weight * tabular_signal
        return 1 / (1 + np.exp(-score))


def train(output_dir: Path, config: TrainConfig) -> Path:
    _ = config
    model = BaselineFusionModel()
    output_dir.mkdir(parents=True, exist_ok=True)
    artifact = {
        "image_head_weight": float(model.image_head_weight[0]),
        "tabular_head_weight": float(model.tabular_head_weight[0]),
    }
    artifact_path = output_dir / "model.json"
    artifact_path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return artifact_path


if __name__ == "__main__":
    path = train(Path("./artifacts"), TrainConfig())
    print(f"saved:{path}")

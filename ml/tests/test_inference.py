from pathlib import Path

from inference.predict import load_model, predict
from training.train_baseline import TrainConfig, train


def test_predict_pipeline(tmp_path: Path) -> None:
    model_path = train(tmp_path, TrainConfig())
    model = load_model(model_path)

    output = predict(
        {
            "request_id": "req-1",
            "image_signal": [0.8, 0.4],
            "tabular_signal": [0.2, 0.5],
        },
        model,
    )

    assert output["request_id"] == "req-1"
    assert len(output["drilling_probability"]) == 2
    assert "confidence_score" in output

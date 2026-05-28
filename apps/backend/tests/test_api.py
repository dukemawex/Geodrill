from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200


def test_analyze() -> None:
    response = client.post(
        "/analyze",
        json={
            "bbox": {
                "min_lon": -102.2,
                "min_lat": 31.1,
                "max_lon": -102.0,
                "max_lat": 31.3,
                "crs": "EPSG:4326",
            }
        },
    )
    data = response.json()
    assert response.status_code == 200
    assert "request_id" in data
    assert "job_id" in data


def test_wells() -> None:
    response = client.get(
        "/wells?min_lon=-102.2&min_lat=31.1&max_lon=-102.0&max_lat=31.3"
    )
    data = response.json()
    assert response.status_code == 200
    assert "request_id" in data
    assert len(data["wells"]) >= 1


def test_heatmap_and_report() -> None:
    job_id = client.post(
        "/analyze",
        json={
            "bbox": {
                "min_lon": -102.2,
                "min_lat": 31.1,
                "max_lon": -102.0,
                "max_lat": 31.3,
                "crs": "EPSG:4326",
            }
        },
    ).json()["job_id"]

    heatmap = client.get(f"/heatmap/{job_id}")
    report = client.get(f"/report/{job_id}")

    assert heatmap.status_code == 200
    assert report.status_code == 200
    assert "request_id" in heatmap.json()
    assert "request_id" in report.json()

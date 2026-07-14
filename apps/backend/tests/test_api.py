from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BBOX = {
    "min_lon": -102.2,
    "min_lat": 31.1,
    "max_lon": -102.0,
    "max_lat": 31.3,
    "crs": "EPSG:4326",
}


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_analyze_returns_scored_job() -> None:
    r = client.post("/analyze", json={"bbox": BBOX})
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "completed"
    assert 0.0 <= data["mean_probability"] <= 1.0
    assert data["overall_risk"] in {"low", "medium", "high"}


def test_invalid_bbox_rejected() -> None:
    bad = dict(BBOX, max_lon=BBOX["min_lon"] - 1)
    assert client.post("/analyze", json={"bbox": bad}).status_code == 422


def test_wells() -> None:
    r = client.get("/wells?min_lon=-102.2&min_lat=31.1&max_lon=-102.0&max_lat=31.3")
    assert r.status_code == 200
    assert len(r.json()["wells"]) >= 1


def test_full_demo_flow() -> None:
    job_id = client.post("/analyze", json={"bbox": BBOX}).json()["job_id"]

    heatmap = client.get(f"/heatmap/{job_id}")
    report = client.get(f"/report/{job_id}")

    assert heatmap.status_code == 200
    assert report.status_code == 200
    hm = heatmap.json()
    rp = report.json()
    # Heatmap has spatially-varied grid cells with real properties.
    assert len(hm["features"]) == 9
    assert all("probability" in f["properties"] for f in hm["features"])
    # Report is derived from the same job and lists ranked zones.
    assert rp["job_id"] == job_id
    assert len(rp["recommendations"]) >= 1
    assert rp["mean_probability"] == client_last_mean(job_id)


def client_last_mean(job_id: str) -> float:
    return client.get(f"/report/{job_id}").json()["mean_probability"]


def test_unknown_job_returns_404() -> None:
    fake = "00000000-0000-0000-0000-000000000000"
    assert client.get(f"/heatmap/{fake}").status_code == 404
    assert client.get(f"/report/{fake}").status_code == 404

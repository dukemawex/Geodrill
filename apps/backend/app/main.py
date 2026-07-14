from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    AnalyzeRequest,
    AnalyzeResponse,
    HeatmapFeatureCollection,
    ReportResponse,
    WellRecord,
    WellsResponse,
)
from .scoring import score_bbox
from .store import store

app = FastAPI(title="GeoDrill Geospatial API", version="0.2.0")

# Allow the Next.js dashboard (any origin in demo) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    """Run the fusion model over the bbox and persist a job result."""
    result = score_bbox(payload.bbox)
    job_id = uuid4()
    store.save(job_id, result)
    return AnalyzeResponse(
        job_id=job_id,
        status="completed",
        mean_probability=result["mean_probability"],
        confidence=result["confidence"],
        overall_risk=result["overall_risk"],
    )


@app.get("/wells", response_model=WellsResponse)
def get_wells(
    min_lon: float = Query(...),
    min_lat: float = Query(...),
    max_lon: float = Query(...),
    max_lat: float = Query(...),
) -> WellsResponse:
    # Demo well fixture inside/near the query area.
    lat = (min_lat + max_lat) / 2
    lon = (min_lon + max_lon) / 2
    return WellsResponse(
        wells=[
            WellRecord(
                well_id="well_demo_001",
                lat=lat,
                lon=lon,
                depth_m=2450,
                production_type="oil",
            )
        ]
    )


@app.get("/heatmap/{job_id}", response_model=HeatmapFeatureCollection)
def get_heatmap(job_id: UUID) -> HeatmapFeatureCollection:
    result = store.get(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="job not found")
    return HeatmapFeatureCollection(features=result["features"])


@app.get("/report/{job_id}", response_model=ReportResponse)
def get_report(job_id: UUID) -> ReportResponse:
    result = store.get(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="job not found")
    return ReportResponse(
        job_id=job_id,
        summary=(
            f"Fusion model scored the area with mean drilling probability "
            f"{result['mean_probability']:.2f} and {result['overall_risk'].value} "
            f"overall risk across {len(result['features'])} grid cells."
        ),
        mean_probability=result["mean_probability"],
        confidence=result["confidence"],
        overall_risk=result["overall_risk"],
        recommendations=result["recommendations"],
    )


@app.websocket("/jobs/{job_id}/status")
async def job_status(websocket: WebSocket, job_id: UUID) -> None:
    await websocket.accept()
    exists = store.get(job_id) is not None
    await websocket.send_json(
        {
            "request_id": str(uuid4()),
            "job_id": str(job_id),
            "status": "completed" if exists else "not_found",
            "progress": 100 if exists else 0,
        }
    )
    await websocket.close()

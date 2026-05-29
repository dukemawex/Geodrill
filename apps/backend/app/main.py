from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import FastAPI, Query, WebSocket

from .models import (
    AnalyzeRequest,
    AnalyzeResponse,
    HeatmapFeatureCollection,
    ReportResponse,
    WellRecord,
    WellsResponse,
    ZoneInsight,
)

app = FastAPI(title="GeoDrill Geospatial API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    _ = payload
    return AnalyzeResponse()


@app.get("/wells", response_model=WellsResponse)
def get_wells(
    min_lon: float = Query(...),
    min_lat: float = Query(...),
    max_lon: float = Query(...),
    max_lat: float = Query(...),
) -> WellsResponse:
    _ = (min_lon, min_lat, max_lon, max_lat)
    return WellsResponse(
        wells=[
            WellRecord(
                well_id="well_demo_001",
                lat=31.224,
                lon=-102.112,
                depth_m=2450,
                production_type="oil",
            )
        ]
    )


@app.get("/heatmap/{job_id}", response_model=HeatmapFeatureCollection)
def get_heatmap(job_id: UUID) -> HeatmapFeatureCollection:
    return HeatmapFeatureCollection(
        features=[
            {
                "type": "Feature",
                "properties": {
                    "job_id": str(job_id),
                    "probability": 0.72,
                    "confidence": 0.81,
                    "risk": "medium",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-102.2, 31.1],
                        [-102.0, 31.1],
                        [-102.0, 31.3],
                        [-102.2, 31.3],
                        [-102.2, 31.1],
                    ]],
                },
            }
        ]
    )


@app.get("/report/{job_id}", response_model=ReportResponse)
def get_report(job_id: UUID) -> ReportResponse:
    return ReportResponse(
        job_id=job_id,
        summary="Demo recommendation generated from satellite + well fusion model.",
        recommendations=[
            ZoneInsight(
                zone_id="zone_a",
                confidence=0.81,
                depth_min_m=2200,
                depth_max_m=2800,
                risk="medium",
            )
        ],
    )


@app.websocket("/jobs/{job_id}/status")
async def job_status(websocket: WebSocket, job_id: UUID) -> None:
    await websocket.accept()
    await websocket.send_json(
        {
            "request_id": str(uuid4()),
            "job_id": str(job_id),
            "status": "running",
            "progress": 35,
        }
    )
    await websocket.close()

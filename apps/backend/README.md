# GeoDrill Backend (FastAPI)

Geospatial API powering the GeoDrill dashboard.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Endpoints

- `GET /health` — health check
- `POST /analyze` — score a bounding box, returns a job
- `GET /heatmap/{job_id}` — per-cell probability/risk GeoJSON
- `GET /report/{job_id}` — ranked zones, depth, confidence, summary
- `GET /wells` — wells within a bbox

## Deploy (Render)

The repo root `render.yaml` deploys this service. In Render:
**New → Blueprint → pick this repo**. It builds from `apps/backend`,
starts uvicorn, and health-checks `/health`. The resulting URL is what you
set as `NEXT_PUBLIC_API_BASE_URL` in the Vercel frontend project.

CORS is currently open (`*`) for the demo; lock it to the Vercel domain for production.

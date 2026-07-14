# GeoDrill

AI-powered geological drilling intelligence platform monorepo.

## Structure

- `apps/frontend`: Next.js 14 dashboard (Vercel target)
- `apps/backend`: FastAPI geospatial API
- `packages/shared`: shared schemas/types
- `infrastructure`: AWS CDK IaC (VPC, Aurora PostgreSQL, S3, Cognito, SageMaker)
- `data/pipelines`: ingestion Lambdas
- `ml`: training and inference scaffolding

## Quickstart

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

### Backend

```bash
cd apps/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Tests

```bash
cd apps/backend && pytest
cd ../../ml && pip install -r requirements.txt && pytest
```

## Demo flow (hackathon priority)

1. Draw/select area on map
2. Trigger `/analyze`
3. Fetch `/heatmap/{job_id}` and `/report/{job_id}`
4. Render probability + confidence/depth/risk insights

## Status

The demo flow is wired end to end:

- `POST /analyze` runs the baseline fusion model over the bounding box, scores a
  3×3 grid, and persists the result as a job.
- `GET /heatmap/{job_id}` returns the per-cell probability/risk GeoJSON.
- `GET /report/{job_id}` returns the ranked zones, depth range, confidence, and
  a summary derived from the same job.
- The Next.js dashboard calls all three and renders the live heatmap + insights.

Run `pytest` in `apps/backend` and `ml`, and `npm run build` in `apps/frontend`.

## Deploying the frontend to Vercel

This is a monorepo. When importing into Vercel, set:

- **Root Directory:** `apps/frontend`
- **Environment variables:**
  - `NEXT_PUBLIC_API_BASE_URL` — the deployed backend URL
  - `NEXT_PUBLIC_MAPBOX_TOKEN` — a Mapbox public token (map tiles)

The backend (FastAPI) and infrastructure (AWS CDK) deploy separately; Vercel
hosts the frontend only.

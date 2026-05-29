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

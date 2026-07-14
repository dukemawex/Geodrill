const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export type BoundingBox = {
  min_lon: number;
  min_lat: number;
  max_lon: number;
  max_lat: number;
  crs: 'EPSG:4326';
};

export type AnalyzeRequest = { bbox: BoundingBox };

export type AnalyzeResponse = {
  request_id: string;
  job_id: string;
  status: string;
  mean_probability: number;
  confidence: number;
  overall_risk: 'low' | 'medium' | 'high';
};

export type HeatmapResponse = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { probability: number; confidence: number; risk: string };
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }>;
};

export type ZoneInsight = {
  zone_id: string;
  confidence: number;
  depth_min_m: number;
  depth_max_m: number;
  risk: 'low' | 'medium' | 'high';
};

export type ReportResponse = {
  job_id: string;
  summary: string;
  mean_probability: number;
  confidence: number;
  overall_risk: 'low' | 'medium' | 'high';
  recommendations: ZoneInsight[];
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function triggerAnalyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  return json(
    await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
  );
}

export async function fetchHeatmap(jobId: string): Promise<HeatmapResponse> {
  return json(await fetch(`${API_BASE}/heatmap/${jobId}`));
}

export async function fetchReport(jobId: string): Promise<ReportResponse> {
  return json(await fetch(`${API_BASE}/report/${jobId}`));
}

export type AnalyzeRequest = {
  bbox: {
    min_lon: number;
    min_lat: number;
    max_lon: number;
    max_lat: number;
    crs: 'EPSG:4326';
  };
};

export async function triggerAnalyze(request: AnalyzeRequest) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Analyze request failed');
  return response.json();
}

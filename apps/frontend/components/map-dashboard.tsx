'use client';

import { useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import {
  triggerAnalyze,
  fetchHeatmap,
  fetchReport,
  type HeatmapResponse,
  type ReportResponse,
} from '../lib/api';

const DEMO_BBOX = {
  min_lon: -102.2,
  min_lat: 31.1,
  max_lon: -102.0,
  max_lat: 31.3,
  crs: 'EPSG:4326' as const,
};

const RISK_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export function MapDashboard() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const analyze = await triggerAnalyze({ bbox: DEMO_BBOX });
      setJobId(analyze.job_id);
      const [hm, rp] = await Promise.all([
        fetchHeatmap(analyze.job_id),
        fetchReport(analyze.job_id),
      ]);
      setHeatmap(hm);
      setReport(rp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const heatmapData = heatmap
    ? {
        type: 'FeatureCollection' as const,
        features: heatmap.features.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            color: RISK_COLOR[f.properties.risk] ?? '#f59e0b',
          },
        })),
      }
    : null;

  return (
    <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', height: '100vh' }}>
      <Map
        initialViewState={{ longitude: -102.1, latitude: 31.2, zoom: 9 }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        {heatmapData && (
          <Source id="heatmap" type="geojson" data={heatmapData}>
            <Layer
              id="heatmap-fill"
              type="fill"
              paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.45 }}
            />
            <Layer
              id="heatmap-outline"
              type="line"
              paint={{ 'line-color': '#111', 'line-width': 0.5 }}
            />
          </Source>
        )}
      </Map>
      <aside style={{ padding: 16, borderLeft: '1px solid #ddd', overflowY: 'auto' }}>
        <h2>GeoDrill</h2>
        <p style={{ color: '#666', fontSize: 13 }}>
          AI-powered drilling intelligence — draw an area and analyze.
        </p>
        <button onClick={runAnalysis} disabled={loading} style={{ padding: '8px 14px' }}>
          {loading ? 'Analyzing…' : 'Analyze Demo Area'}
        </button>
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
        <p style={{ fontSize: 12, color: '#999' }}>Job: {jobId ?? '—'}</p>

        {report && (
          <>
            <h3>Summary</h3>
            <p style={{ fontSize: 14 }}>{report.summary}</p>
            <ul style={{ fontSize: 14, lineHeight: 1.6 }}>
              <li>Mean probability: {(report.mean_probability * 100).toFixed(0)}%</li>
              <li>Confidence: {(report.confidence * 100).toFixed(0)}%</li>
              <li>Overall risk: {report.overall_risk}</li>
            </ul>
            <h3>Top zones</h3>
            {report.recommendations.map((z) => (
              <div
                key={z.zone_id}
                style={{
                  borderLeft: `4px solid ${RISK_COLOR[z.risk] ?? '#f59e0b'}`,
                  padding: '4px 10px',
                  marginBottom: 8,
                }}
              >
                <strong>{z.zone_id}</strong> — {z.risk} risk
                <br />
                <span style={{ fontSize: 13, color: '#555' }}>
                  {z.depth_min_m}m – {z.depth_max_m}m · confidence{' '}
                  {(z.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </>
        )}
      </aside>
    </main>
  );
}

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
import { RiskBadge, riskColor } from './badge';
import { IconAlert, IconDrill, IconGauge, IconLayers, IconPlay, IconSpinner } from './icons';

const DEMO_BBOX = {
  min_lon: -102.2,
  min_lat: 31.1,
  max_lon: -102.0,
  max_lat: 31.3,
  crs: 'EPSG:4326' as const,
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
      setError(e instanceof Error ? e.message : 'Analysis failed. Is the API reachable?');
    } finally {
      setLoading(false);
    }
  };

  const heatmapData = heatmap
    ? {
        type: 'FeatureCollection' as const,
        features: heatmap.features.map((f) => ({
          ...f,
          properties: { ...f.properties, color: riskColor(f.properties.risk) },
        })),
      }
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}>
      <Header onRun={runAnalysis} loading={loading} jobId={jobId} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', minHeight: 0 }}>
        <MapPanel heatmapData={heatmapData} hasResult={!!heatmap} />
        <InsightsPanel
          report={report}
          loading={loading}
          error={error}
          onRun={runAnalysis}
        />
      </div>
    </div>
  );
}

function Header({
  onRun,
  loading,
  jobId,
}: {
  onRun: () => void;
  loading: boolean;
  jobId: string | null;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 22px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-elev)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'oklch(0.72 0.14 220 / 0.16)',
            color: 'var(--accent)',
          }}
        >
          <IconDrill width={18} height={18} />
        </span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.2 }}>GeoDrill</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Drilling intelligence · Permian demo area
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {jobId && (
          <span style={{ fontSize: 12, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
            job {jobId.slice(0, 8)}
          </span>
        )}
        <button
          onClick={onRun}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            background: 'var(--accent)',
            color: 'oklch(0.16 0.02 250)',
            fontWeight: 600,
            fontSize: 13.5,
          }}
        >
          {loading ? <IconSpinner width={15} height={15} /> : <IconPlay width={14} height={14} />}
          {loading ? 'Analyzing…' : 'Run analysis'}
        </button>
      </div>
    </header>
  );
}

function MapPanel({
  heatmapData,
  hasResult,
}: {
  heatmapData: unknown;
  hasResult: boolean;
}) {
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      {MAPBOX_TOKEN ? (
        <Map
          initialViewState={{ longitude: -102.1, latitude: 31.2, zoom: 9.2 }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          {heatmapData ? (
            <Source id="heatmap" type="geojson" data={heatmapData as never}>
              <Layer
                id="heatmap-fill"
                type="fill"
                paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.42 }}
              />
              <Layer
                id="heatmap-line"
                type="line"
                paint={{ 'line-color': 'oklch(0.9 0 0 / 0.5)', 'line-width': 0.6 }}
              />
            </Source>
          ) : null}
        </Map>
      ) : (
        <MapFallback heatmapData={heatmapData} hasResult={hasResult} />
      )}
      <Legend />
    </div>
  );
}

/** Sharp SVG grid preview so the app looks complete before a Mapbox token is set. */
function MapFallback({ heatmapData, hasResult }: { heatmapData: unknown; hasResult: boolean }) {
  const features =
    (heatmapData as { features?: Array<{ properties: { color: string; probability: number } }> })
      ?.features ?? [];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(120% 120% at 30% 20%, oklch(0.26 0.02 250) 0%, oklch(0.18 0.012 250) 70%)',
      }}
    >
      {hasResult ? (
        <div style={{ display: 'grid', gap: 10, animation: 'fade-up 240ms ease both' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 92px)',
              gridAutoRows: 92,
              gap: 6,
              padding: 10,
              borderRadius: 12,
              background: 'oklch(0.15 0.01 250 / 0.55)',
              border: '1px solid var(--line)',
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                title={`p=${f.properties.probability}`}
                style={{
                  borderRadius: 8,
                  background: f.properties.color,
                  opacity: 0.28 + f.properties.probability * 0.62,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'oklch(0.15 0.01 250)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {(f.properties.probability * 100).toFixed(0)}%
              </div>
            ))}
          </div>
          <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>
            Grid preview · add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> for the satellite map
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-faint)', maxWidth: 300 }}>
          <IconLayers width={30} height={30} />
          <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 4 }}>No analysis yet</p>
          <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>
            Run an analysis to score the target area and render the drilling-probability heatmap.
          </p>
        </div>
      )}
    </div>
  );
}

function Legend() {
  const items = [
    ['Low', 'var(--risk-low)'],
    ['Medium', 'var(--risk-med)'],
    ['High', 'var(--risk-high)'],
  ] as const;
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        display: 'flex',
        gap: 14,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'oklch(0.16 0.01 250 / 0.82)',
        border: '1px solid var(--line)',
        backdropFilter: 'blur(6px)',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--text-faint)' }}>Probability</span>
      {items.map(([label, c]) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
          <span style={{ color: 'var(--text-dim)' }}>{label}</span>
        </span>
      ))}
    </div>
  );
}

function InsightsPanel({
  report,
  loading,
  error,
  onRun,
}: {
  report: ReportResponse | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
}) {
  return (
    <aside
      style={{
        borderLeft: '1px solid var(--line)',
        background: 'var(--panel)',
        overflowY: 'auto',
        padding: 20,
      }}
    >
      {error && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: 12,
            borderRadius: 10,
            background: 'oklch(0.66 0.19 25 / 0.12)',
            color: 'var(--risk-high)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <IconAlert width={16} height={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && !report && <SkeletonPanel />}

      {!loading && !report && !error && (
        <div style={{ color: 'var(--text-faint)', fontSize: 13.5, lineHeight: 1.6 }}>
          <h2 style={{ fontSize: 15, color: 'var(--text)', margin: '2px 0 8px' }}>Insights</h2>
          <p>
            Results appear here after you run an analysis — overall probability, model confidence,
            and the highest-ranked drilling zones with depth ranges.
          </p>
          <button
            onClick={onRun}
            style={{
              marginTop: 12,
              padding: '9px 14px',
              background: 'var(--bg-elev)',
              color: 'var(--text)',
              border: '1px solid var(--line)',
              fontSize: 13,
            }}
          >
            Run first analysis
          </button>
        </div>
      )}

      {report && (
        <div style={{ animation: 'fade-up 240ms ease both' }}>
          <h2 style={{ fontSize: 15, margin: '2px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconGauge width={16} height={16} /> Analysis summary
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.55, margin: '0 0 16px' }}>
            {report.summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <Metric label="Mean probability" value={`${(report.mean_probability * 100).toFixed(0)}%`} />
            <Metric label="Confidence" value={`${(report.confidence * 100).toFixed(0)}%`} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <RiskBadge risk={report.overall_risk} />
          </div>

          <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-faint)', margin: '22px 0 10px' }}>
            Top zones
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {report.recommendations.map((z) => (
              <div
                key={z.zone_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 13px',
                  borderRadius: 10,
                  background: 'var(--bg-elev)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{z.zone_id}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                    {z.depth_min_m}–{z.depth_max_m} m · {(z.confidence * 100).toFixed(0)}% conf.
                  </div>
                </div>
                <RiskBadge risk={z.risk} />
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-elev)', border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function SkeletonPanel() {
  const bar = (w: string, h = 14) => (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'var(--line)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
  );
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {bar('55%', 16)}
      {bar('100%')}
      {bar('80%')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
        <div style={{ height: 62, borderRadius: 10, background: 'var(--line)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
        <div style={{ height: 62, borderRadius: 10, background: 'var(--line)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

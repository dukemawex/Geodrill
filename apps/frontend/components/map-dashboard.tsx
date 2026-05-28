'use client';

import { useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import { triggerAnalyze } from '../lib/api';

const DEMO_BBOX = {
  min_lon: -102.2,
  min_lat: 31.1,
  max_lon: -102.0,
  max_lat: 31.3,
  crs: 'EPSG:4326' as const,
};

export function MapDashboard() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const runAnalysis = async () => {
    const data = await triggerAnalyze({ bbox: DEMO_BBOX });
    setJobId(data.job_id);
    setRequestId(data.request_id);
  };

  return (
    <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', height: '100vh' }}>
      <Map
        initialViewState={{ longitude: -102.1, latitude: 31.2, zoom: 9 }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        <Source
          id="demo-heat"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [-102.2, 31.1],
                    [-102.0, 31.1],
                    [-102.0, 31.3],
                    [-102.2, 31.3],
                    [-102.2, 31.1],
                  ]],
                },
              },
            ],
          }}
        >
          <Layer id="heatmap-fill" type="fill" paint={{ 'fill-color': '#f59e0b', 'fill-opacity': 0.35 }} />
        </Source>
      </Map>
      <aside style={{ padding: 16, borderLeft: '1px solid #ddd' }}>
        <h2>GeoDrill Demo</h2>
        <button onClick={runAnalysis}>Analyze Drawn Area</button>
        <p>Request ID: {requestId ?? '—'}</p>
        <p>Job ID: {jobId ?? '—'}</p>
        <p>Confidence: 0.81</p>
        <p>Depth range: 2200m - 2800m</p>
        <p>Risk: Medium</p>
      </aside>
    </main>
  );
}

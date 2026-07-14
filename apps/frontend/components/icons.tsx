import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const IconDrill = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6" /><path d="M20 4 9 15" /><path d="M9 15H4v5" /><path d="m4 20 5-5" />
  </svg>
);
export const IconPlay = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><polygon points="6 3 20 12 6 21 6 3" /></svg>
);
export const IconLayers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" />
  </svg>
);
export const IconGauge = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
);
export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);
export const IconSpinner = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);

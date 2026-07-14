const RISK_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  low: { bg: 'oklch(0.74 0.15 150 / 0.14)', fg: 'var(--risk-low)', label: 'Low' },
  medium: { bg: 'oklch(0.8 0.14 80 / 0.15)', fg: 'var(--risk-med)', label: 'Medium' },
  high: { bg: 'oklch(0.66 0.19 25 / 0.16)', fg: 'var(--risk-high)', label: 'High' },
};

export function RiskBadge({ risk }: { risk: string }) {
  const s = RISK_STYLE[risk] ?? RISK_STYLE.medium;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.2,
        background: s.bg,
        color: s.fg,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.fg }} />
      {s.label} risk
    </span>
  );
}

export const riskColor = (risk: string) =>
  ({ low: 'oklch(0.74 0.15 150)', medium: 'oklch(0.8 0.14 80)', high: 'oklch(0.66 0.19 25)' }[risk] ??
    'oklch(0.8 0.14 80)');

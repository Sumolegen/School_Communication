import React from 'react';

interface TrendPoint {
  label: string;
  value: number;
}

export const LineTrendChart: React.FC<{ title: string; points: TrendPoint[]; unit?: string }> = ({
  title,
  points,
  unit = '%',
}) => {
  const width = 480;
  const height = 180;
  const pad = 28;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;

  const coords = points.map((p, idx) => {
    const x = points.length === 1 ? width / 2 : pad + (idx / (points.length - 1)) * usableW;
    const y = pad + usableH - (Math.min(100, Math.max(0, p.value)) / 100) * usableH;
    return { ...p, x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>{title}</h3>
      {points.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No trend data available yet.</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#cbd5e1" strokeWidth="1" />
          {coords.length > 1 && (
            <polyline fill="none" stroke="var(--brand-accent)" strokeWidth="3" points={polylinePoints} />
          )}
          {coords.map((c) => (
            <g key={c.label}>
              <circle cx={c.x} cy={c.y} r="5" fill="var(--brand-primary)" />
              <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="600">
                {c.value}
                {unit}
              </text>
              <text x={c.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#475569">
                {c.label.slice(0, 12)}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
};

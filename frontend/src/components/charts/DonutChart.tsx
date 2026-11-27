import React from 'react';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export const DonutChart: React.FC<{ title: string; segments: DonutSegment[]; centerLabel?: string }> = ({
  title,
  segments,
  centerLabel,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulative = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--brand-primary)' }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 132, height: 132 }}>
          <svg width="132" height="132" viewBox="0 0 132 132">
            <circle cx="66" cy="66" r={radius} fill="none" stroke="var(--bg-muted)" strokeWidth="18" />
            {total > 0 &&
              segments.map((seg) => {
                const dash = (seg.value / total) * circumference;
                const offset = -cumulative * circumference;
                cumulative += seg.value / total;
                return (
                  <circle
                    key={seg.label}
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                    transform="rotate(-90 66 66)"
                  />
                );
              })}
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--brand-primary)',
            }}
          >
            {centerLabel ?? total}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {segments.map((seg) => (
            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: seg.color, display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{seg.label}:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{seg.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

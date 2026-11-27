import React from 'react';

interface BarItem {
  label: string;
  value: number;
  sublabel?: string;
}

export const BarChart: React.FC<{ title: string; items: BarItem[]; maxValue?: number; unit?: string }> = ({
  title,
  items,
  maxValue = 100,
  unit = '%',
}) => (
  <div className="card">
    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--brand-primary)' }}>{title}</h3>
    {items.length === 0 ? (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No chart data available yet.</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => {
          const pct = Math.min(100, Math.max(0, (item.value / maxValue) * 100));
          return (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                  {item.value}
                  {unit}
                  {item.sublabel ? ` (${item.sublabel})` : ''}
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: 'var(--bg-muted)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: pct >= 75 ? 'var(--brand-primary)' : 'var(--brand-accent)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

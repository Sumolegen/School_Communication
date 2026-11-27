import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon, accent }) => (
  <div
    className="card"
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      borderTop: accent ? '3px solid var(--brand-accent)' : '3px solid var(--brand-primary)',
    }}
  >
    <div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{subtext}</div>}
    </div>
    {icon && (
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: accent ? 'var(--brand-accent-soft)' : 'var(--brand-primary-soft)',
          color: accent ? 'var(--brand-accent-hover)' : 'var(--brand-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    )}
  </div>
);

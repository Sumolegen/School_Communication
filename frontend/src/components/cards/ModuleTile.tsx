import React from 'react';
import { Link } from 'react-router-dom';

interface ModuleTileProps {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const ModuleTile: React.FC<ModuleTileProps> = ({ title, description, to, icon, badge }) => (
  <Link
    to={to}
    className="card"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      textDecoration: 'none',
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: 'var(--brand-primary-soft)',
        color: 'var(--brand-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <strong style={{ color: 'var(--text-primary)', fontSize: '0.98rem' }}>{title}</strong>
        {badge !== undefined && badge !== 0 && (
          <span
            style={{
              background: 'var(--brand-accent)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>{description}</div>
    </div>
  </Link>
);

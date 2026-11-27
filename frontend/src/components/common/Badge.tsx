import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
}

const VARIANT_STYLES: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
  default: { background: 'var(--bg-muted)', color: 'var(--text-secondary)' },
  primary: { background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' },
  accent: { background: 'var(--brand-accent-soft)', color: 'var(--brand-accent-hover)' },
  success: { background: 'var(--success-bg)', color: 'var(--success-text)' },
  warning: { background: 'var(--warning-bg)', color: 'var(--warning-text)' },
  danger: { background: 'var(--danger-bg)', color: 'var(--danger-text)' },
  info: { background: 'var(--info-bg)', color: 'var(--info-text)' },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      ...VARIANT_STYLES[variant],
    }}
  >
    {children}
  </span>
);

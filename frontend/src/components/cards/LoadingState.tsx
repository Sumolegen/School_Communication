import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className="card" style={{ textAlign: 'center', padding: '42px 20px', color: 'var(--text-muted)' }}>
    <div
      style={{
        width: 32,
        height: 32,
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--brand-accent)',
        borderRadius: '50%',
        margin: '0 auto 12px',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ fontWeight: 500 }}>{message}</div>
  </div>
);

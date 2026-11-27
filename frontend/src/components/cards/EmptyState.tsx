import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing to show yet',
  description = 'Records will appear here once created by your school.',
  action,
}) => (
  <div className="card" style={{ textAlign: 'center', padding: '44px 20px' }}>
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'var(--bg-muted)',
        color: 'var(--text-muted)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}
    >
      <Inbox size={24} />
    </div>
    <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{title}</h3>
    <p style={{ margin: '0 auto', maxWidth: 420, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
      {description}
    </p>
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

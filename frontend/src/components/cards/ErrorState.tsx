import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div
    className="card"
    style={{
      borderColor: '#fecaca',
      background: '#fef2f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--danger-text)' }}>
      <AlertTriangle size={20} />
      <span style={{ fontWeight: 500 }}>{message}</span>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

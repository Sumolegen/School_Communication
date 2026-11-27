import React from 'react';
import { X } from 'lucide-react';
import { useNotifications } from '@/hooks';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 100,
        maxWidth: 360,
      }}
    >
      {toasts.map((toast) => {
        const bg =
          toast.type === 'success'
            ? '#166534'
            : toast.type === 'error'
              ? '#991b1b'
              : 'var(--brand-primary)';
        return (
          <div
            key={toast.id}
            style={{
              background: bg,
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: '0.9rem',
            }}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 2 }}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

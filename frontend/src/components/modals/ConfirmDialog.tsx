import React from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  busy,
}) => (
  <Modal open={open} title={title} onClose={onCancel} maxWidth={420}>
    <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '0.94rem' }}>{message}</p>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
      <Button variant="outline" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={busy}>
        {busy ? 'Please wait...' : confirmLabel}
      </Button>
    </div>
  </Modal>
);

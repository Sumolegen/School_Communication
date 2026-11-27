import React, { useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from './Modal';

interface ImagePreviewModalProps {
  open: boolean;
  imageUrl: string | null;
  caption?: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  open,
  imageUrl,
  caption,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);

  if (!open || !imageUrl) return null;

  return (
    <Modal open={open} title={caption || 'Photo Preview'} onClose={onClose} maxWidth={860}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
            <ZoomOut size={15} /> Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}>
            <ZoomIn size={15} /> Zoom In
          </Button>
        </div>
        <a href={imageUrl} download="school-photo.jpg" className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
          <Download size={15} /> Save Image
        </a>
      </div>
      <div style={{ overflow: 'auto', maxHeight: '65vh', textAlign: 'center', background: '#0f172a', borderRadius: 10, padding: 12 }}>
        <img
          src={imageUrl}
          alt={caption || 'School gallery'}
          style={{
            maxWidth: '100%',
            transform: `scale(${zoom})`,
            transformOrigin: 'center top',
            transition: 'transform 0.15s ease',
            borderRadius: 6,
          }}
        />
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { filesService } from '@/services/files.service';
import { FileMeta } from '@/types';

interface FileUploaderProps {
  category: 'HOMEWORK' | 'CIRCULAR' | 'PHOTO' | 'ANNOUNCEMENT' | 'MESSAGE' | 'LOGO' | 'CLASS_UPDATE' | 'OTHER';
  accept?: string;
  label?: string;
  onUploaded: (file: FileMeta) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  category,
  accept = 'application/pdf,image/jpeg,image/png,image/webp',
  label = 'Upload PDF or Image (images auto-compressed)',
  onUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await filesService.upload(file, category);
      onUploaded(uploaded);
    } catch {
      setError('Upload failed. Ensure file is PDF/Image under 10 MB.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--brand-primary)',
          background: 'var(--brand-primary-soft)',
          color: 'var(--brand-primary)',
          fontWeight: 600,
          fontSize: '0.86rem',
          cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        <Upload size={16} />
        <span>{uploading ? 'Compressing & uploading...' : label}</span>
        <input type="file" accept={accept} onChange={handleChange} disabled={uploading} style={{ display: 'none' }} />
      </label>
      {error && <div style={{ fontSize: '0.78rem', color: 'var(--danger-text)', marginTop: 6 }}>{error}</div>}
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FileUploader } from '@/components/forms/FileUploader';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useDebounce, useNotifications, usePermissions } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { communicationService } from '@/services/communication.service';
import { filesService } from '@/services/files.service';
import { CircularItem, FileMeta } from '@/types';
import { formatDate, todayIsoDate } from '@/utils';

export const CircularsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canPublish = hasPermission('CIRCULAR_PUBLISH');

  const [items, setItems] = useState<CircularItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [circularDate, setCircularDate] = useState(todayIsoDate());
  const [file, setFile] = useState<FileMeta | null>(null);

  const loadCirculars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communicationService.listCirculars({
        search: debouncedSearch || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setItems(res.items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    void loadCirculars();
  }, [loadCirculars]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('error', 'Please upload a PDF or image circular.');
      return;
    }
    try {
      await communicationService.createCircular({
        title,
        description: description || undefined,
        circularDate,
        fileId: file.id,
      });
      showToast('success', 'Circular published.');
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setFile(null);
      await loadCirculars();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Official Circulars"
        subtitle="Downloadable PDF and image circulars with search and date filters"
        actions={
          canPublish && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Upload Circular
            </Button>
          )
        }
      />

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search circulars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input type="date" className="input" style={{ width: 'auto' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCirculars} />
      ) : items.length === 0 ? (
        <EmptyState title="No circulars found" />
      ) : (
        <div className="grid-2">
          {items.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="var(--brand-primary)" />
                  <strong>{c.title}</strong>
                </div>
                {c.description && <p style={{ margin: '6px 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{c.description}</p>}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formatDate(c.circularDate)} • {c.file.originalName}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const url = await filesService.getDownloadBlobUrl(c.file.id);
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <Download size={14} /> Open
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Upload Official Circular" onClose={() => setModalOpen(false)}>
        <form onSubmit={handlePublish}>
          <FormField label="Circular Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label="Date" required>
            <input className="input" type="date" value={circularDate} onChange={(e) => setCircularDate(e.target.value)} required />
          </FormField>
          <FormField label="Summary / Note">
            <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <FormField label="Circular PDF / Image" required>
            <FileUploader category="CIRCULAR" onUploaded={setFile} />
            {file && <div style={{ fontSize: '0.82rem', marginTop: 6 }}>Uploaded: {file.originalName}</div>}
          </FormField>
          <Button type="submit" variant="accent">
            Publish Circular
          </Button>
        </form>
      </Modal>
    </div>
  );
};

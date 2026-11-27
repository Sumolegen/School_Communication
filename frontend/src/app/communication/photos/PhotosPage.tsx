import React, { useCallback, useEffect, useState } from 'react';
import { Image, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FileUploader } from '@/components/forms/FileUploader';
import { FormField } from '@/components/forms/FormField';
import { ImagePreviewModal } from '@/components/modals/ImagePreviewModal';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useNotifications, usePermissions } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { communicationService } from '@/services/communication.service';
import { filesService } from '@/services/files.service';
import { studentsService } from '@/services/students.service';
import { ClassSection, FileMeta, PhotoAlbumItem } from '@/types';
import { formatDate, todayIsoDate } from '@/utils';

export const PhotosPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canUpload = hasPermission('PHOTO_UPLOAD');

  const [albums, setAlbums] = useState<PhotoAlbumItem[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [previewItem, setPreviewItem] = useState<{ url: string; caption?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(todayIsoDate());
  const [sectionId, setSectionId] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<FileMeta[]>([]);

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, secRes] = await Promise.all([
        communicationService.listPhotoAlbums(),
        studentsService.listSections().catch(() => []),
      ]);
      setAlbums(data);
      setSections(secRes);

      const fileIds = data.flatMap((a) => a.photos.map((p) => p.file.id));
      const entries = await Promise.all(
        fileIds.map(async (id) => {
          try {
            return [id, await filesService.getDownloadBlobUrl(id)] as const;
          } catch {
            return [id, ''] as const;
          }
        }),
      );
      setResolvedUrls(Object.fromEntries(entries));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlbums();
  }, [loadAlbums]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await communicationService.createPhotoAlbum({
        title,
        description: description || undefined,
        eventDate,
        sectionId: sectionId || undefined,
        photos: uploadedPhotos.map((f) => ({ fileId: f.id })),
      });
      showToast('success', 'Photo album published.');
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setUploadedPhotos([]);
      await loadAlbums();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="School & Class Photo Gallery"
        subtitle="Event albums, annual days, and classroom activity photos with zoom preview"
        actions={
          canUpload && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Create Photo Album
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAlbums} />
      ) : albums.length === 0 ? (
        <EmptyState title="No photo albums yet" description="School event and classroom photo albums will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {albums.map((album) => (
            <div key={album.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image size={18} /> {album.title}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {formatDate(album.eventDate)} {album.section ? `• ${album.section.schoolClass?.name} ${album.section.name}` : '• School-wide'}
                  </div>
                </div>
              </div>
              {album.description && <p style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>{album.description}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {album.photos.map((photo) => {
                  const url = resolvedUrls[photo.file.id];
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => url && setPreviewItem({ url, caption: photo.caption || album.title })}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 10,
                        padding: 0,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'var(--bg-muted)',
                        height: 130,
                      }}
                    >
                      {url ? (
                        <img src={url} alt={photo.caption || album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ padding: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Loading image...</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImagePreviewModal
        open={Boolean(previewItem)}
        imageUrl={previewItem?.url ?? null}
        caption={previewItem?.caption}
        onClose={() => setPreviewItem(null)}
      />

      <Modal open={modalOpen} title="Create Photo Album" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreateAlbum}>
          <FormField label="Album Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <div className="grid-2">
            <FormField label="Event Date" required>
              <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            </FormField>
            <FormField label="Class Scope (optional)">
              <select className="select" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">Entire School</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.schoolClass?.name} - {sec.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Description">
            <textarea className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <FormField label="Upload Photos (auto-compressed)">
            <FileUploader
              category="PHOTO"
              accept="image/jpeg,image/png,image/webp"
              label="Add Photo"
              onUploaded={(file) => setUploadedPhotos((prev) => [...prev, file])}
            />
            {uploadedPhotos.length > 0 && (
              <div style={{ fontSize: '0.82rem', marginTop: 6 }}>{uploadedPhotos.length} photo(s) uploaded.</div>
            )}
          </FormField>
          <Button type="submit" variant="accent">
            Publish Album
          </Button>
        </form>
      </Modal>
    </div>
  );
};

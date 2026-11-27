import React, { useCallback, useEffect, useState } from 'react';
import { Check, Megaphone, Plus } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { StatusPill } from '@/components/common/StatusPill';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FileUploader } from '@/components/forms/FileUploader';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Pagination } from '@/components/tables/Pagination';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { communicationService } from '@/services/communication.service';
import { filesService } from '@/services/files.service';
import { studentsService } from '@/services/students.service';
import { AnnouncementItem, ClassSection, FileMeta, PriorityLevel, TargetScope } from '@/types';
import { formatDateTime } from '@/utils';

export const AnnouncementsPage: React.FC = () => {
  const { user, activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();

  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [targetScope, setTargetScope] = useState<TargetScope>(
    user?.role === 'TEACHER' ? 'CLASS_SECTION' : 'ENTIRE_SCHOOL',
  );
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<FileMeta | null>(null);

  const canPublish = hasPermission('ANNOUNCEMENT_PUBLISH');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, secRes] = await Promise.all([
        communicationService.listAnnouncements({
          kind: 'ANNOUNCEMENT',
          studentId: activeStudent?.id,
          page,
        }),
        studentsService.listSections().catch(() => []),
      ]);
      setItems(res.items);
      setTotalPages(res.meta.totalPages);
      setSections(secRes);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await communicationService.createAnnouncement({
        title,
        body,
        priority,
        targetScope,
        sectionIds: targetScope === 'CLASS_SECTION' ? selectedSectionIds : undefined,
        attachmentFileId: attachment?.id,
      });
      showToast('success', 'Announcement published.');
      setModalOpen(false);
      setTitle('');
      setBody('');
      setAttachment(null);
      setSelectedSectionIds([]);
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await communicationService.markAnnouncementRead(id);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleDownload = async (file: FileMeta) => {
    try {
      const url = await filesService.getDownloadBlobUrl(file.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="School-wide notices and class announcements with read receipts"
        actions={
          canPublish && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Publish Announcement
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : items.length === 0 ? (
        <EmptyState title="No announcements yet" description="School notices will appear here once published." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ borderLeft: item.priority === 'URGENT' ? '4px solid var(--danger-text)' : '4px solid var(--brand-primary)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Megaphone size={17} color="var(--brand-primary)" />
                    <strong style={{ fontSize: '1.05rem', color: 'var(--brand-primary)' }}>{item.title}</strong>
                    <StatusPill status={item.priority} />
                    <Badge variant={item.isRead ? 'success' : 'accent'}>{item.isRead ? 'Read' : 'Unread'}</Badge>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    By {item.createdBy?.fullName ?? 'School'} • {formatDateTime(item.publishedAt)}
                  </div>
                </div>
                {!item.isRead && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkRead(item.id)}>
                    <Check size={14} /> Mark Read
                  </Button>
                )}
              </div>

              <p style={{ margin: '12px 0 0', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{item.body}</p>

              {item.attachmentFile && (
                <div style={{ marginTop: 12 }}>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(item.attachmentFile!)}>
                    Download Attachment ({item.attachmentFile.originalName})
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modalOpen} title="Publish Announcement" onClose={() => setModalOpen(false)}>
        <form onSubmit={handlePublish}>
          <FormField label="Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label="Message" required>
            <textarea className="textarea" rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
          </FormField>
          <div className="grid-2">
            <FormField label="Priority">
              <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)}>
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
              </select>
            </FormField>
            <FormField label="Target Scope">
              <select className="select" value={targetScope} onChange={(e) => setTargetScope(e.target.value as TargetScope)}>
                {user?.role !== 'TEACHER' && <option value="ENTIRE_SCHOOL">Entire School</option>}
                <option value="CLASS_SECTION">Selected Classes</option>
              </select>
            </FormField>
          </div>
          {targetScope === 'CLASS_SECTION' && (
            <FormField label="Target Class Sections" required>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {sections.map((sec) => {
                  const checked = selectedSectionIds.includes(sec.id);
                  return (
                    <label
                      key={sec.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: checked ? 'var(--brand-primary-soft)' : 'var(--bg-surface)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedSectionIds((prev) =>
                            e.target.checked ? [...prev, sec.id] : prev.filter((id) => id !== sec.id),
                          )
                        }
                      />
                      {sec.schoolClass?.name} {sec.name}
                    </label>
                  );
                })}
              </div>
            </FormField>
          )}
          <FormField label="Attachment (optional)">
            <FileUploader category="ANNOUNCEMENT" onUploaded={setAttachment} />
            {attachment && <div style={{ fontSize: '0.82rem', marginTop: 6 }}>Attached: {attachment.originalName}</div>}
          </FormField>
          <Button type="submit" variant="accent">
            Publish Now
          </Button>
        </form>
      </Modal>
    </div>
  );
};

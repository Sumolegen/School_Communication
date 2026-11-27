import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { communicationService } from '@/services/communication.service';
import { studentsService } from '@/services/students.service';
import { ClassSection, ClassUpdateItem } from '@/types';
import { formatDateTime } from '@/utils';

export const ClassUpdatesPage: React.FC = () => {
  const { activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canPublish = hasPermission('CLASS_UPDATE_PUBLISH');

  const [items, setItems] = useState<ClassUpdateItem[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [sectionId, setSectionId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, secRes] = await Promise.all([
        communicationService.listClassUpdates({ studentId: activeStudent?.id }),
        studentsService.listSections().catch(() => []),
      ]);
      setItems(res.items);
      setSections(secRes);
      if (!sectionId && secRes[0]) setSectionId(secRes[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await communicationService.createClassUpdate({ sectionId, title, content });
      showToast('success', 'Class update posted.');
      setModalOpen(false);
      setTitle('');
      setContent('');
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Class Updates"
        subtitle="Daily classroom updates, activity notes, and teacher reminders"
        actions={
          canPublish && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Post Class Update
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : items.length === 0 ? (
        <EmptyState title="No class updates yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((u) => (
            <div key={u.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={17} color="var(--brand-accent)" />
                  <strong>{u.title}</strong>
                </div>
                {u.section && (
                  <Badge variant="primary">
                    {u.section.schoolClass?.name} {u.section.name}
                  </Badge>
                )}
              </div>
              <p style={{ margin: '10px 0 6px', whiteSpace: 'pre-wrap' }}>{u.content}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {u.teacher?.user.fullName ?? 'Class Teacher'} • {formatDateTime(u.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Post Class Update" onClose={() => setModalOpen(false)}>
        <form onSubmit={handlePublish}>
          <FormField label="Class & Section" required>
            <select className="select" value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.schoolClass?.name} - {sec.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Headline" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label="Details / Reminder" required>
            <textarea className="textarea" rows={4} value={content} onChange={(e) => setContent(e.target.value)} required />
          </FormField>
          <Button type="submit" variant="accent">
            Post Update
          </Button>
        </form>
      </Modal>
    </div>
  );
};

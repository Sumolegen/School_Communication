import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Plus, WifiOff } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FileUploader } from '@/components/forms/FileUploader';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { UI_STRINGS } from '@/constants';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { filesService } from '@/services/files.service';
import { homeworkService } from '@/services/homework.service';
import { studentsService } from '@/services/students.service';
import { ClassSection, FileMeta, HomeworkItem, SubjectItem } from '@/types';
import { formatDate, todayIsoDate } from '@/utils';

export const HomeworkPage: React.FC = () => {
  const { activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canPublish = hasPermission('HOMEWORK_PUBLISH');

  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(todayIsoDate());
  const [attachments, setAttachments] = useState<FileMeta[]>([]);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hwRes, secRes, subjRes] = await Promise.all([
        homeworkService.list({
          studentId: activeStudent?.id,
          subjectId: subjectFilter || undefined,
          date: dateFilter || undefined,
        }),
        studentsService.listSections().catch(() => []),
        academicsService.listSubjects().catch(() => []),
      ]);
      setItems(hwRes.data.items);
      setFromCache(hwRes.fromOfflineCache);
      setSections(secRes);
      setSubjects(subjRes);
      if (!sectionId && secRes[0]) setSectionId(secRes[0].id);
      if (!subjectId && subjRes[0]) setSubjectId(subjRes[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id, subjectFilter, dateFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await homeworkService.create({
        sectionId,
        subjectId,
        title,
        instructions,
        dueDate,
        attachmentFileIds: attachments.map((a) => a.id),
        externalLinks: linkUrl.trim() ? [{ label: linkLabel.trim() || 'Study Resource', url: linkUrl.trim() }] : [],
      });
      showToast('success', 'Homework shared with class & parents.');
      setModalOpen(false);
      setTitle('');
      setInstructions('');
      setAttachments([]);
      setLinkLabel('');
      setLinkUrl('');
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  // Group homework by assignedDate
  const grouped = items.reduce<Record<string, HomeworkItem[]>>((acc, hw) => {
    const key = hw.assignedDate.slice(0, 10);
    acc[key] = acc[key] ?? [];
    acc[key].push(hw);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Homework & Learning Materials"
        subtitle="Daily homework feed grouped by date with compressed attachments and study links"
        actions={
          canPublish && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Share Homework
            </Button>
          )
        }
      />

      {fromCache && (
        <div
          className="card"
          style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <WifiOff size={18} />
          <span>{UI_STRINGS.en.offlineBanner}</span>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select
          className="select"
          style={{ width: 'auto', minWidth: 190 }}
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input"
          style={{ width: 'auto' }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {(subjectFilter || dateFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubjectFilter('');
              setDateFilter('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : items.length === 0 ? (
        <EmptyState title="No homework assigned" description="Check back later or clear active filters." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grouped).map(([dateKey, list]) => (
            <div key={dateKey}>
              <h3 style={{ margin: '0 0 10px', fontSize: '0.96rem', color: 'var(--brand-primary)' }}>
                Assigned on {formatDate(dateKey)}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {list.map((hw) => (
                  <div key={hw.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <BookOpen size={17} color="var(--brand-primary)" />
                        <strong style={{ fontSize: '1.02rem' }}>{hw.title}</strong>
                        <Badge variant="primary">{hw.subject?.name}</Badge>
                        {hw.section && (
                          <Badge>
                            {hw.section.schoolClass?.name} {hw.section.name}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="accent">Due: {formatDate(hw.dueDate)}</Badge>
                    </div>
                    <p style={{ margin: '10px 0 8px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                      {hw.instructions}
                    </p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Assigned by {hw.teacher?.user.fullName ?? 'Teacher'}
                    </div>

                    {(hw.attachments?.length || hw.externalLinks?.length) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                        {hw.attachments?.map((att) => (
                          <Button
                            key={att.id}
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const url = await filesService.getDownloadBlobUrl(att.file.id);
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            {att.file.originalName}
                          </Button>
                        ))}
                        {hw.externalLinks?.map((lnk, idx) => (
                          <a
                            key={idx}
                            href={lnk.url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                          >
                            <ExternalLink size={14} /> {lnk.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Share Daily Homework" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="grid-2">
            <FormField label="Class & Section" required>
              <select className="select" value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.schoolClass?.name} - {sec.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Subject" required>
              <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Homework Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label="Instructions" required>
            <textarea className="textarea" rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} required />
          </FormField>
          <FormField label="Due Date" required>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </FormField>
          <div className="grid-2">
            <FormField label="External Study Link Label">
              <input className="input" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="e.g. Video Lesson" />
            </FormField>
            <FormField label="External Study URL">
              <input className="input" type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </FormField>
          </div>
          <FormField label="Attachments (PDF or Images)">
            <FileUploader
              category="HOMEWORK"
              onUploaded={(file) => setAttachments((prev) => [...prev, file])}
            />
            {attachments.length > 0 && (
              <div style={{ fontSize: '0.82rem', marginTop: 6 }}>
                Uploaded: {attachments.map((a) => a.originalName).join(', ')}
              </div>
            )}
          </FormField>
          <Button type="submit" variant="accent">
            Publish Homework
          </Button>
        </form>
      </Modal>
    </div>
  );
};

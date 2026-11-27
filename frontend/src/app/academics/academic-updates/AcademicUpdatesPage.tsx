import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { AcademicUpdateItem, ExamTermItem, StudentRecord } from '@/types';
import { formatDateTime } from '@/utils';

export const AcademicUpdatesPage: React.FC = () => {
  const { activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canCreate = hasPermission('MARKS_ENTER');

  const [updates, setUpdates] = useState<AcademicUpdateItem[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [terms, setTerms] = useState<ExamTermItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [examTermId, setExamTermId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uList, tList] = await Promise.all([
        academicsService.listAcademicUpdates(activeStudent?.id),
        academicsService.listExamTerms().catch(() => []),
      ]);
      setUpdates(uList);
      setTerms(tList);
      if (canCreate) {
        const stuRes = await studentsService.listStudents({ limit: 100 });
        setStudents(stuRes.items);
        if (stuRes.items[0]) setStudentId(stuRes.items[0].id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id, canCreate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicsService.createAcademicUpdate({
        studentId,
        examTermId: examTermId || undefined,
        title,
        summary,
        remarks: remarks || undefined,
      });
      showToast('success', 'Academic update sent to student/parent.');
      setModalOpen(false);
      setTitle('');
      setSummary('');
      setRemarks('');
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Academic Updates"
        subtitle="Qualitative teacher feedback and term progress notes"
        actions={
          canCreate && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Post Academic Update
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : updates.length === 0 ? (
        <EmptyState title="No academic updates yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {updates.map((u) => (
            <div key={u.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={18} color="var(--brand-primary)" />
                  <strong>{u.title}</strong>
                </div>
                {u.examTerm && <Badge variant="primary">{u.examTerm.name}</Badge>}
              </div>
              <p style={{ margin: '10px 0 6px' }}>{u.summary}</p>
              {u.remarks && <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Remarks: {u.remarks}</div>}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Student: {u.student?.fullName} • By {u.teacher?.user.fullName ?? 'Teacher'} • {formatDateTime(u.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Post Academic Update" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <FormField label="Student" required>
            <select className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.admissionNo})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Exam Term (optional)">
            <select className="select" value={examTermId} onChange={(e) => setExamTermId(e.target.value)}>
              <option value="">General Progress</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Update Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label="Progress Summary" required>
            <textarea className="textarea" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} required />
          </FormField>
          <FormField label="Teacher Remarks">
            <input className="input" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </FormField>
          <Button type="submit" variant="accent">
            Publish Update
          </Button>
        </form>
      </Modal>
    </div>
  );
};

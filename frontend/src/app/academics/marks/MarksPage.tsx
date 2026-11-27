import React, { useCallback, useEffect, useState } from 'react';
import { Award, Save } from 'lucide-react';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { Button } from '@/components/common/Button';
import { StatusPill } from '@/components/common/StatusPill';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { AssessmentItem, ExamMarkItem, ExamTermItem, StudentRecord } from '@/types';

export const MarksPage: React.FC = () => {
  const { activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canEnter = hasPermission('MARKS_ENTER');

  const [terms, setTerms] = useState<ExamTermItem[]>([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [marks, setMarks] = useState<ExamMarkItem[]>([]);

  // Marks entry state for Teachers/Admins
  const [mode, setMode] = useState<'VIEW' | 'ENTER'>(canEnter ? 'ENTER' : 'VIEW');
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [sectionStudents, setSectionStudents] = useState<StudentRecord[]>([]);
  const [draftScores, setDraftScores] = useState<Record<string, { marks: string; remarks: string }>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    academicsService.listExamTerms().then(setTerms).catch(() => {});
    if (canEnter) {
      academicsService
        .listAssessments()
        .then((list) => {
          setAssessments(list);
          if (list[0]) setSelectedAssessmentId(list[0].id);
        })
        .catch(() => {});
    }
  }, [canEnter]);

  const loadViewMarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await academicsService.listMarks({
        studentId: activeStudent?.id,
        termId: selectedTermId || undefined,
      });
      setMarks(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id, selectedTermId]);

  const loadAssessmentStudents = useCallback(async () => {
    const assessment = assessments.find((a) => a.id === selectedAssessmentId);
    if (!assessment) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [stuRes, existingMarks] = await Promise.all([
        studentsService.listStudents({ sectionId: assessment.sectionId, limit: 100 }),
        academicsService.listMarks({ assessmentId: assessment.id }),
      ]);
      setSectionStudents(stuRes.items);
      const existingMap = new Map(existingMarks.map((m) => [m.studentId, m]));
      const nextDraft: Record<string, { marks: string; remarks: string }> = {};
      for (const stu of stuRes.items) {
        const m = existingMap.get(stu.id);
        nextDraft[stu.id] = {
          marks: m ? String(m.marksObtained) : '',
          remarks: m?.remarks ?? '',
        };
      }
      setDraftScores(nextDraft);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [assessments, selectedAssessmentId]);

  useEffect(() => {
    if (mode === 'ENTER' && canEnter) {
      void loadAssessmentStudents();
    } else {
      void loadViewMarks();
    }
  }, [mode, canEnter, loadAssessmentStudents, loadViewMarks]);

  const handleSaveMarks = async () => {
    const assessment = assessments.find((a) => a.id === selectedAssessmentId);
    if (!assessment) return;

    const entries = Object.entries(draftScores)
      .filter(([, val]) => val.marks.trim() !== '')
      .map(([studentId, val]) => ({
        studentId,
        marksObtained: Number(val.marks),
        remarks: val.remarks.trim() || undefined,
      }));

    if (entries.length === 0) {
      showToast('error', 'Enter marks for at least one student.');
      return;
    }

    setSaving(true);
    try {
      const res = await academicsService.bulkEnterMarks({ assessmentId: assessment.id, entries });
      showToast('success', `Saved marks for ${res.savedCount} student(s).`);
      await loadAssessmentStudents();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Marks & Examination Results"
        subtitle="Subject-wise marks, grades, percentage, pass/fail status, and teacher remarks"
        actions={
          canEnter && (
            <>
              <Button variant={mode === 'ENTER' ? 'primary' : 'outline'} onClick={() => setMode('ENTER')}>
                <Award size={16} /> Enter Marks
              </Button>
              <Button variant={mode === 'VIEW' ? 'primary' : 'outline'} onClick={() => setMode('VIEW')}>
                View Published Marks
              </Button>
            </>
          )
        }
      />

      {mode === 'ENTER' && canEnter ? (
        <>
          <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <select
              className="select"
              style={{ width: 'auto', minWidth: 280 }}
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.section?.schoolClass?.name} {a.section?.name} • Max {a.maxMarks})
                </option>
              ))}
            </select>
            <Button variant="accent" onClick={handleSaveMarks} disabled={saving || sectionStudents.length === 0}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save All Marks'}
            </Button>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadAssessmentStudents} />
          ) : sectionStudents.length === 0 ? (
            <EmptyState title="No students found in this assessment section" />
          ) : (
            <DataTable
              rows={sectionStudents}
              rowKey={(s) => s.id}
              columns={[
                { key: 'roll', header: 'Roll #', render: (s) => s.rollNo ?? '—' },
                { key: 'name', header: 'Student', render: (s) => <strong>{s.fullName}</strong> },
                {
                  key: 'marks',
                  header: 'Marks Obtained',
                  render: (s) => (
                    <input
                      type="number"
                      min={0}
                      max={assessments.find((a) => a.id === selectedAssessmentId)?.maxMarks ?? 100}
                      className="input"
                      style={{ width: 110 }}
                      value={draftScores[s.id]?.marks ?? ''}
                      onChange={(e) =>
                        setDraftScores((prev) => ({
                          ...prev,
                          [s.id]: { marks: e.target.value, remarks: prev[s.id]?.remarks ?? '' },
                        }))
                      }
                    />
                  ),
                },
                {
                  key: 'remarks',
                  header: 'Teacher Remarks',
                  render: (s) => (
                    <input
                      className="input"
                      placeholder="Optional remark..."
                      value={draftScores[s.id]?.remarks ?? ''}
                      onChange={(e) =>
                        setDraftScores((prev) => ({
                          ...prev,
                          [s.id]: { marks: prev[s.id]?.marks ?? '', remarks: e.target.value },
                        }))
                      }
                    />
                  ),
                },
              ]}
            />
          )}
        </>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <select
              className="select"
              style={{ width: 'auto', minWidth: 220 }}
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
            >
              <option value="">All Exam Terms</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.termType})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadViewMarks} />
          ) : (
            <DataTable
              rows={marks}
              rowKey={(m) => m.id}
              emptyTitle="No marks published yet"
              columns={[
                { key: 'term', header: 'Term', render: (m) => m.assessment?.examTerm?.name ?? '—' },
                { key: 'subject', header: 'Subject', render: (m) => <strong>{m.assessment?.subject?.name}</strong> },
                {
                  key: 'score',
                  header: 'Marks',
                  render: (m) => `${m.marksObtained} / ${m.assessment?.maxMarks ?? 100}`,
                },
                { key: 'pct', header: '%', render: (m) => `${m.percentage}%` },
                { key: 'grade', header: 'Grade', render: (m) => <strong>{m.grade}</strong> },
                { key: 'status', header: 'Result', render: (m) => <StatusPill status={m.isPassed ? 'PASS' : 'FAIL'} /> },
                { key: 'remarks', header: 'Remarks', render: (m) => m.remarks ?? '—' },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { useNotifications, usePermissions } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { AssessmentItem, ClassSection, ExamTermItem, SubjectItem } from '@/types';
import { formatDate, todayIsoDate } from '@/utils';

export const AssessmentsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canManage = hasPermission('EXAM_MANAGE');

  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [terms, setTerms] = useState<ExamTermItem[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [examTermId, setExamTermId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(35);
  const [examDate, setExamDate] = useState(todayIsoDate());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aList, tList, secList, subList] = await Promise.all([
        academicsService.listAssessments(),
        academicsService.listExamTerms(),
        studentsService.listSections(),
        academicsService.listSubjects(),
      ]);
      setAssessments(aList);
      setTerms(tList);
      setSections(secList);
      setSubjects(subList);
      if (tList[0]) setExamTermId(tList[0].id);
      if (secList[0]) setSectionId(secList[0].id);
      if (subList[0]) setSubjectId(subList[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicsService.createAssessment({
        examTermId,
        sectionId,
        subjectId,
        title,
        maxMarks,
        passMarks,
        examDate,
      });
      showToast('success', 'Assessment created.');
      setModalOpen(false);
      setTitle('');
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Assessments"
        subtitle="Configure subject assessments, maximum marks, pass marks, and exam dates"
        actions={
          canManage && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Create Assessment
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          rows={assessments}
          rowKey={(a) => a.id}
          columns={[
            { key: 'title', header: 'Assessment', render: (a) => <strong>{a.title}</strong> },
            { key: 'term', header: 'Exam Term', render: (a) => <Badge variant="primary">{a.examTerm?.name}</Badge> },
            { key: 'sec', header: 'Class', render: (a) => `${a.section?.schoolClass?.name ?? ''} ${a.section?.name ?? ''}` },
            { key: 'sub', header: 'Subject', render: (a) => a.subject?.name },
            { key: 'marks', header: 'Max / Pass', render: (a) => `${a.maxMarks} / ${a.passMarks}` },
            { key: 'date', header: 'Exam Date', render: (a) => formatDate(a.examDate) },
          ]}
        />
      )}

      <Modal open={modalOpen} title="Create Subject Assessment" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <FormField label="Exam Term" required>
            <select className="select" value={examTermId} onChange={(e) => setExamTermId(e.target.value)} required>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid-2">
            <FormField label="Class & Section" required>
              <select className="select" value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.schoolClass?.name} - {s.name}
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
          <FormField label="Assessment Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quarterly - Science" required />
          </FormField>
          <div className="grid-3">
            <FormField label="Max Marks" required>
              <input className="input" type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} required />
            </FormField>
            <FormField label="Pass Marks" required>
              <input className="input" type="number" min={0} value={passMarks} onChange={(e) => setPassMarks(Number(e.target.value))} required />
            </FormField>
            <FormField label="Exam Date" required>
              <input className="input" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} required />
            </FormField>
          </div>
          <Button type="submit" variant="accent">
            Save Assessment
          </Button>
        </form>
      </Modal>
    </div>
  );
};

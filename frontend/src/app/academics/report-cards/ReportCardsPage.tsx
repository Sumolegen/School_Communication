import React, { useCallback, useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { Button } from '@/components/common/Button';
import { StatusPill } from '@/components/common/StatusPill';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { ExamTermItem, ReportCardResponse, StudentRecord } from '@/types';

export const ReportCardsPage: React.FC = () => {
  const { user, activeStudent } = useAuth();
  const isStaffOrAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN';

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudent?.id ?? '');
  const [terms, setTerms] = useState<ExamTermItem[]>([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [report, setReport] = useState<ReportCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeStudent?.id) setSelectedStudentId(activeStudent.id);
  }, [activeStudent?.id]);

  useEffect(() => {
    academicsService.listExamTerms().then(setTerms).catch(() => {});
    if (isStaffOrAdmin) {
      studentsService
        .listStudents({ limit: 100 })
        .then((res) => {
          setStudents(res.items);
          if (!selectedStudentId && res.items[0]) setSelectedStudentId(res.items[0].id);
        })
        .catch(() => {});
    }
  }, [isStaffOrAdmin]);

  const loadReport = useCallback(async () => {
    if (!selectedStudentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setReport(await academicsService.getReportCard(selectedStudentId, selectedTermId || undefined));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId, selectedTermId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return (
    <div>
      <PageHeader
        title="Progress Report Card"
        subtitle="Formatted printable report card with subject marks, grades, percentage, and attendance"
        actions={
          report && (
            <Button variant="accent" onClick={() => window.print()}>
              <Printer size={16} /> Print / Save as PDF
            </Button>
          )
        }
      />

      <div className="card no-print" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {isStaffOrAdmin && (
          <select
            className="select"
            style={{ width: 'auto', minWidth: 240 }}
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.admissionNo})
              </option>
            ))}
          </select>
        )}
        <select
          className="select"
          style={{ width: 'auto', minWidth: 200 }}
          value={selectedTermId}
          onChange={(e) => setSelectedTermId(e.target.value)}
        >
          <option value="">All Terms Combined</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReport} />
      ) : !report ? (
        <EmptyState title="Select a student to view report card" />
      ) : (
        <div className="card" style={{ padding: 28 }}>
          <div
            style={{
              background: report.school.primaryColor || '#0F294A',
              color: '#ffffff',
              padding: 20,
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>{report.school.name}</h2>
              <div style={{ fontSize: '0.84rem', opacity: 0.85 }}>
                Academic Progress Report • {report.examTerm?.name ?? 'Full Academic Year'}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.84rem' }}>
              <div>Academic Year: {report.student.academicYear}</div>
              <div>{report.school.contactPhone ?? ''}</div>
            </div>
          </div>

          <div className="grid-4" style={{ margin: '18px 0', padding: 14, background: 'var(--bg-muted)', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student</div>
              <strong>{report.student.fullName}</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admission #</div>
              <strong>{report.student.admissionNo}</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class & Section</div>
              <strong>
                {report.student.className} - {report.student.sectionName}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance</div>
              <strong>{report.summary.attendancePercentage}%</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Max</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th>Result</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {report.subjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No marks recorded yet for this selection.
                    </td>
                  </tr>
                ) : (
                  report.subjects.map((sub) => (
                    <tr key={sub.markId}>
                      <td>{sub.termName}</td>
                      <td>
                        <strong>{sub.subjectName}</strong>
                      </td>
                      <td>{sub.marksObtained}</td>
                      <td>{sub.maxMarks}</td>
                      <td>{sub.percentage}%</td>
                      <td>
                        <strong>{sub.grade}</strong>
                      </td>
                      <td>
                        <StatusPill status={sub.isPassed ? 'PASS' : 'FAIL'} />
                      </td>
                      <td>{sub.remarks ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 10,
              background: 'var(--brand-primary-soft)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <strong>Total:</strong> {report.summary.totalObtained} / {report.summary.totalMax} ({report.summary.overallPercentage}%)
            </div>
            <div>
              <strong>Overall Grade:</strong> {report.summary.overallGrade}
            </div>
            <StatusPill status={report.summary.resultStatus} />
          </div>
        </div>
      )}
    </div>
  );
};

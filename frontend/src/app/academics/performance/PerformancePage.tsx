import React, { useCallback, useEffect, useState } from 'react';
import { LineTrendChart } from '@/components/charts/LineTrendChart';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { StatusPill } from '@/components/common/StatusPill';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { StudentRecord } from '@/types';

export const PerformancePage: React.FC = () => {
  const { user, activeStudent } = useAuth();
  const isStaffOrAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN';

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudent?.id ?? '');
  const [data, setData] = useState<{
    studentName: string;
    terms: Array<{
      termId: string;
      termName: string;
      termType: string;
      totalObtained: number;
      totalMax: number;
      overallPercentage: number;
      subjects: Array<{
        subjectName: string;
        marksObtained: number;
        maxMarks: number;
        percentage: number;
        grade: string;
        isPassed: boolean;
      }>;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeStudent?.id) setSelectedStudentId(activeStudent.id);
  }, [activeStudent?.id]);

  useEffect(() => {
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

  const loadComparison = useCallback(async () => {
    if (!selectedStudentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await academicsService.getTermComparison(selectedStudentId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    void loadComparison();
  }, [loadComparison]);

  return (
    <div>
      <PageHeader
        title="Term-Wise Academic Progress"
        subtitle="Tabular comparison across Unit Test, Quarterly, Half-Yearly, and Annual examinations"
      />

      {isStaffOrAdmin && students.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
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
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadComparison} />
      ) : !data || data.terms.length === 0 ? (
        <EmptyState title="No term exam history available yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <LineTrendChart
            title={`Academic Trajectory — ${data.studentName}`}
            points={data.terms.map((t) => ({ label: t.termName, value: t.overallPercentage }))}
          />
          {data.terms.map((term) => (
            <div key={term.termId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong style={{ fontSize: '1.05rem', color: 'var(--brand-primary)' }}>
                  {term.termName} ({term.termType})
                </strong>
                <strong>
                  {term.totalObtained} / {term.totalMax} ({term.overallPercentage}%)
                </strong>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {term.subjects.map((s) => (
                      <tr key={s.subjectName}>
                        <td>{s.subjectName}</td>
                        <td>
                          {s.marksObtained} / {s.maxMarks}
                        </td>
                        <td>{s.percentage}%</td>
                        <td>
                          <strong>{s.grade}</strong>
                        </td>
                        <td>
                          <StatusPill status={s.isPassed ? 'PASS' : 'FAIL'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

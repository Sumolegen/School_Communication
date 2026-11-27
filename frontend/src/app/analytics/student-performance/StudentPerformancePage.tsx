import React, { useCallback, useEffect, useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LineTrendChart } from '@/components/charts/LineTrendChart';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth } from '@/hooks';
import { analyticsService } from '@/services/analytics.service';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { StudentAnalyticsResponse, StudentRecord } from '@/types';

export const StudentPerformancePage: React.FC = () => {
  const { user, activeStudent } = useAuth();
  const isStaffOrAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN';

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(activeStudent?.id ?? '');
  const [data, setData] = useState<StudentAnalyticsResponse | null>(null);
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

  const loadAnalytics = useCallback(async () => {
    if (!selectedStudentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await analyticsService.getStudentPerformance(selectedStudentId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div>
      <PageHeader title="Student Performance Analytics" subtitle="Subject proficiency breakdown and term progression" />

      {isStaffOrAdmin && students.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <select className="select" style={{ width: 'auto', minWidth: 240 }} value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
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
        <ErrorState message={error} onRetry={loadAnalytics} />
      ) : !data ? (
        <EmptyState title="Select a student to view analytics" />
      ) : (
        <div className="grid-2">
          <BarChart
            title={`Subject Averages — ${data.studentName}`}
            items={data.subjectBreakdown.map((s) => ({
              label: s.subjectName,
              value: s.averagePercentage,
              sublabel: `${s.assessmentsCount} test(s)`,
            }))}
          />
          <LineTrendChart
            title="Term Trend"
            points={data.termTrend.map((t) => ({ label: t.termName, value: t.percentage }))}
          />
        </div>
      )}
    </div>
  );
};

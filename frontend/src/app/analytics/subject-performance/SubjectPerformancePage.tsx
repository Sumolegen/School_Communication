import React, { useCallback, useEffect, useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { analyticsService } from '@/services/analytics.service';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { ClassSection, SubjectPerformanceItem } from '@/types';

export const SubjectPerformancePage: React.FC = () => {
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [items, setItems] = useState<SubjectPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentsService.listSections().then(setSections).catch(() => {});
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await analyticsService.getSubjectPerformance(sectionId || undefined));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div>
      <PageHeader title="Subject Performance Analytics" subtitle="Average scores, pass rates, and top benchmarks across subjects" />

      {sections.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <select className="select" style={{ width: 'auto', minWidth: 220 }} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">All Authorized Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.schoolClass?.name} - {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAnalytics} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BarChart
            title="Subject Average Score (%)"
            items={items.map((i) => ({ label: i.subjectName, value: i.averagePercentage, sublabel: `Pass ${i.passRate}%` }))}
          />
          <DataTable
            rows={items}
            rowKey={(i) => i.subjectId}
            columns={[
              { key: 'name', header: 'Subject', render: (i) => <strong>{i.subjectName}</strong> },
              { key: 'avg', header: 'Average %', render: (i) => `${i.averagePercentage}%` },
              { key: 'pass', header: 'Pass Rate', render: (i) => `${i.passRate}%` },
              { key: 'high', header: 'Highest %', render: (i) => `${i.highestPercentage}%` },
              { key: 'entries', header: 'Records', render: (i) => i.entriesCount },
            ]}
          />
        </div>
      )}
    </div>
  );
};

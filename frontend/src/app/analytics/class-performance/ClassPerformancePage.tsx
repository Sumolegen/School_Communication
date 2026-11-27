import React, { useCallback, useEffect, useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { academicsService } from '@/services/academics.service';
import { analyticsService } from '@/services/analytics.service';
import { getApiErrorMessage } from '@/services/api';
import { ClassPerformanceItem, ExamTermItem } from '@/types';

export const ClassPerformancePage: React.FC = () => {
  const [terms, setTerms] = useState<ExamTermItem[]>([]);
  const [termId, setTermId] = useState('');
  const [items, setItems] = useState<ClassPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    academicsService.listExamTerms().then(setTerms).catch(() => {});
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await analyticsService.getClassPerformance(termId || undefined));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [termId]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div>
      <PageHeader title="Class Performance Analytics" subtitle="Compare academic averages and pass percentages across sections" />

      <div className="card" style={{ marginBottom: 16 }}>
        <select className="select" style={{ width: 'auto', minWidth: 220 }} value={termId} onChange={(e) => setTermId(e.target.value)}>
          <option value="">All Exam Terms</option>
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
        <ErrorState message={error} onRetry={loadAnalytics} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BarChart
            title="Class & Section Average (%)"
            items={items.map((i) => ({ label: i.className, value: i.averagePercentage, sublabel: `Pass ${i.passRate}%` }))}
          />
          <DataTable
            rows={items}
            rowKey={(i) => i.sectionId}
            columns={[
              { key: 'cls', header: 'Class & Section', render: (i) => <strong>{i.className}</strong> },
              { key: 'avg', header: 'Average %', render: (i) => `${i.averagePercentage}%` },
              { key: 'pass', header: 'Pass Rate', render: (i) => `${i.passRate}%` },
              { key: 'eval', header: 'Evaluated Entries', render: (i) => i.assessmentsEvaluated },
            ]}
          />
        </div>
      )}
    </div>
  );
};

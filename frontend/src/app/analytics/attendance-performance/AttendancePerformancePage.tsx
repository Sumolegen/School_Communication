import React, { useCallback, useEffect, useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { PageHeader } from '@/components/navigation/PageHeader';
import { analyticsService } from '@/services/analytics.service';
import { getApiErrorMessage } from '@/services/api';
import { AttendancePerformanceResponse } from '@/types';
import { currentMonthKey } from '@/utils';

export const AttendancePerformancePage: React.FC = () => {
  const [month, setMonth] = useState(currentMonthKey());
  const [data, setData] = useState<AttendancePerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await analyticsService.getAttendancePerformance(month));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const totals = (data?.bySection ?? []).reduce(
    (acc, s) => ({
      present: acc.present + s.present,
      absent: acc.absent + s.absent,
      late: acc.late + s.late,
      leave: acc.leave + s.leave,
    }),
    { present: 0, absent: 0, late: 0, leave: 0 },
  );

  return (
    <div>
      <PageHeader title="Attendance Performance Analytics" subtitle="Monthly attendance rates by section and status distribution" />

      <div className="card" style={{ marginBottom: 16 }}>
        <input type="month" className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAnalytics} />
      ) : (
        <div className="grid-2">
          <BarChart
            title="Attendance Rate by Section (%)"
            items={(data?.bySection ?? []).map((s) => ({
              label: s.className,
              value: s.attendanceRate,
              sublabel: `${s.present + s.late}/${s.total}`,
            }))}
          />
          <DonutChart
            title="Monthly Attendance Breakdown"
            segments={[
              { label: 'Present', value: totals.present, color: '#16a34a' },
              { label: 'Absent', value: totals.absent, color: '#dc2626' },
              { label: 'Late', value: totals.late, color: '#d97706' },
              { label: 'Leave', value: totals.leave, color: '#2563eb' },
            ]}
          />
        </div>
      )}
    </div>
  );
};

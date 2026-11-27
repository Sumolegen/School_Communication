import React, { useCallback, useEffect, useState } from 'react';
import { CheckSquare, FileBarChart } from 'lucide-react';
import { CalendarDayMarker, MonthCalendar } from '@/components/calendars/MonthCalendar';
import { StatCard } from '@/components/cards/StatCard';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { Button } from '@/components/common/Button';
import { StatusPill } from '@/components/common/StatusPill';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { attendanceService } from '@/services/attendance.service';
import { studentsService } from '@/services/students.service';
import { AttendanceRosterItem, AttendanceStatus, ClassSection, StudentAttendanceResponse } from '@/types';
import { currentMonthKey, todayIsoDate } from '@/utils';

export const AttendancePage: React.FC = () => {
  const { user, activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canMark = hasPermission('ATTENDANCE_MARK');

  const [tab, setTab] = useState<'MARK' | 'REPORT' | 'CALENDAR'>(canMark ? 'MARK' : 'CALENDAR');
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [month, setMonth] = useState(currentMonthKey());

  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceResponse | null>(null);
  const [report, setReport] = useState<{
    overallPercentage: number;
    totals: { present: number; absent: number; late: number; leave: number; total: number };
    students: Array<{
      studentId: string;
      fullName: string;
      admissionNo: string;
      sectionName: string;
      present: number;
      absent: number;
      late: number;
      leave: number;
      total: number;
      percentage: number;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (canMark) {
      studentsService
        .listSections()
        .then((list) => {
          setSections(list);
          if (list[0]) setSectionId((prev) => prev || list[0].id);
        })
        .catch(() => {});
    }
  }, [canMark]);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'MARK' && canMark) {
        if (!sectionId) {
          setRoster([]);
          setLoading(false);
          return;
        }
        const res = await attendanceService.getRoster(sectionId, date);
        setRoster(res.students);
        setAlreadySubmitted(res.alreadySubmitted);
      } else if (tab === 'REPORT' && canMark) {
        const res = await attendanceService.getReport({ sectionId: sectionId || undefined, month });
        setReport(res);
      } else if (activeStudent?.id) {
        const res = await attendanceService.getStudentAttendance(activeStudent.id, month);
        setStudentAttendance(res);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, canMark, sectionId, date, month, activeStudent?.id]);

  useEffect(() => {
    void loadTabData();
  }, [loadTabData]);

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  };

  const handleSubmitBulk = async () => {
    if (!sectionId) return;
    setSubmitting(true);
    try {
      const res = await attendanceService.markBulk({
        sectionId,
        date,
        records: roster.map((r) => ({ studentId: r.studentId, status: r.status, remarks: r.remarks || undefined })),
      });
      showToast(
        'success',
        `Attendance saved for ${res.savedCount} students. ${res.absenceAlertsSent} absence alert(s) sent.`,
      );
      setAlreadySubmitted(true);
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const calendarMarkers: CalendarDayMarker[] = [
    ...(studentAttendance?.records.map((r) => ({
      dateIso: r.date.slice(0, 10),
      label: r.status,
      tone: (r.status === 'PRESENT'
        ? 'success'
        : r.status === 'ABSENT'
          ? 'danger'
          : r.status === 'LATE'
            ? 'warning'
            : 'info') as CalendarDayMarker['tone'],
    })) ?? []),
    ...(studentAttendance?.holidays.map((h) => ({
      dateIso: h.eventDate.slice(0, 10),
      label: `Holiday: ${h.title}`,
      tone: 'info' as const,
    })) ?? []),
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={
          canMark
            ? 'Fast daily marking (defaults to Present) with automatic absence notifications'
            : 'Monthly attendance calendar and overall attendance percentage'
        }
        actions={
          canMark && (
            <>
              <Button variant={tab === 'MARK' ? 'primary' : 'outline'} onClick={() => setTab('MARK')}>
                <CheckSquare size={16} /> Daily Marking
              </Button>
              <Button variant={tab === 'REPORT' ? 'primary' : 'outline'} onClick={() => setTab('REPORT')}>
                <FileBarChart size={16} /> Attendance Reports
              </Button>
            </>
          )
        }
      />

      {canMark && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto', minWidth: 200 }} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.schoolClass?.name} - {sec.name}
              </option>
            ))}
          </select>
          {tab === 'MARK' ? (
            <input type="date" className="input" style={{ width: 'auto' }} value={date} onChange={(e) => setDate(e.target.value)} />
          ) : (
            <input type="month" className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} />
          )}
        </div>
      )}

      {!canMark && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <input type="month" className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusPill status="PRESENT" />
            <StatusPill status="ABSENT" />
            <StatusPill status="LATE" />
            <StatusPill status="LEAVE" />
            <StatusPill status="HOLIDAY" />
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTabData} />
      ) : tab === 'MARK' && canMark ? (
        roster.length === 0 ? (
          <EmptyState title="No students in selected section" />
        ) : (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong>{roster.length} Students</strong>{' '}
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  • {alreadySubmitted ? 'Already submitted (tap emoji to update)' : 'Defaulted to Present — tap the yellow smiley emoji to mark Absent'}
                </span>
              </div>
              <Button variant="accent" onClick={handleSubmitBulk} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roster.map((stu) => {
                const isAbsent = stu.status === 'ABSENT';
                return (
                  <div
                    key={stu.studentId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: isAbsent ? '#fef2f2' : 'var(--bg-muted)',
                      border: isAbsent ? '1px solid #fecaca' : '1px solid transparent',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong>{stu.fullName}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Roll #{stu.rollNo || '—'} • Adm #{stu.admissionNo}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(stu.studentId, isAbsent ? 'PRESENT' : 'ABSENT')}
                      aria-label={isAbsent ? `${stu.fullName} is Absent — click to mark Present` : `${stu.fullName} is Present — click to mark Absent`}
                      title={isAbsent ? 'Absent (click to mark Present)' : 'Present (click to mark Absent)'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: isAbsent ? '2px solid #dc2626' : '2px solid #eab308',
                        background: isAbsent ? '#fee2e2' : '#fef9c3',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'transform 0.12s ease, background 0.15s ease',
                      }}
                    >
                      {isAbsent ? (
                        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                          <circle cx="18" cy="18" r="16" fill="#EF4444" />
                          <circle cx="12.5" cy="14" r="2.1" fill="#FFFFFF" />
                          <circle cx="23.5" cy="14" r="2.1" fill="#FFFFFF" />
                          <path
                            d="M11.5 25C13.2 21.8 22.8 21.8 24.5 25"
                            stroke="#FFFFFF"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                          <circle cx="18" cy="18" r="16" fill="#FACC15" />
                          <circle cx="12.5" cy="14" r="2.1" fill="#713F12" />
                          <circle cx="23.5" cy="14" r="2.1" fill="#713F12" />
                          <path
                            d="M11.5 21.5C13.2 25.5 22.8 25.5 24.5 21.5"
                            stroke="#713F12"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : tab === 'REPORT' && report ? (
        <>
          <div className="grid-4" style={{ marginBottom: 16 }}>
            <StatCard label="Overall Attendance" value={`${report.overallPercentage}%`} accent />
            <StatCard label="Present Entries" value={report.totals.present} />
            <StatCard label="Absent Entries" value={report.totals.absent} />
            <StatCard label="Late / Leave" value={report.totals.late + report.totals.leave} />
          </div>
          <DataTable
            rows={report.students}
            rowKey={(s) => s.studentId}
            columns={[
              { key: 'adm', header: 'Admission #', render: (s) => s.admissionNo },
              { key: 'name', header: 'Student', render: (s) => <strong>{s.fullName}</strong> },
              { key: 'sec', header: 'Section', render: (s) => s.sectionName },
              { key: 'p', header: 'Present', render: (s) => s.present },
              { key: 'a', header: 'Absent', render: (s) => s.absent },
              { key: 'l', header: 'Late', render: (s) => s.late },
              { key: 'pct', header: 'Attendance %', render: (s) => <strong>{s.percentage}%</strong> },
            ]}
          />
        </>
      ) : studentAttendance ? (
        <>
          <div className="grid-4" style={{ marginBottom: 16 }}>
            <StatCard label="Overall Attendance" value={`${studentAttendance.overallSummary.percentage}%`} accent />
            <StatCard label="Present Days" value={studentAttendance.overallSummary.present} />
            <StatCard label="Absent Days" value={studentAttendance.overallSummary.absent} />
            <StatCard label="Late / Leave" value={studentAttendance.overallSummary.late + studentAttendance.overallSummary.leave} />
          </div>
          <MonthCalendar month={month} markers={calendarMarkers} />
        </>
      ) : (
        <EmptyState title="Select a student to view attendance" description={user?.role === 'PARENT' ? 'Choose a child from the top bar.' : undefined} />
      )}
    </div>
  );
};

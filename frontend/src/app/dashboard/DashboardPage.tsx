import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  GraduationCap,
  Image,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { ModuleTile } from '@/components/cards/ModuleTile';
import { StatCard } from '@/components/cards/StatCard';
import { StatusPill } from '@/components/common/StatusPill';
import { PageHeader } from '@/components/navigation/PageHeader';
import { ROLE_LABELS, ROUTES, UI_STRINGS } from '@/constants';
import { useAuth } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardSummaryResponse } from '@/types';
import { formatDate } from '@/utils';
import { SchoolAdminControls } from './SchoolAdminControls';
import { SuperAdminSchoolConsole } from './SuperAdminSchoolConsole';

export const DashboardPage: React.FC = () => {
  const { user, activeStudent } = useAuth();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getSummary(activeStudent?.id);
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load dashboard summary.'));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return <LoadingState message="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;
  if (!data || !user) return <EmptyState />;

  // Platform Super Admin Dashboard
  if (user.role === 'SUPER_ADMIN') {
    const pm = data.platformMetrics;
    return (
      <div>
        <PageHeader
          title="Platform Super Admin Console"
          subtitle="Cross-school onboarding, subscription status, and platform health"
        />
        <div className="grid-4">
          <StatCard label="Total Schools" value={pm?.totalSchools ?? 0} icon={<Building2 size={20} />} />
          <StatCard label="Active Subscriptions" value={pm?.activeSchools ?? 0} accent icon={<Award size={20} />} />
          <StatCard label="Total Users" value={pm?.totalUsers ?? 0} icon={<Users size={20} />} />
          <StatCard label="Total Students" value={pm?.totalStudents ?? 0} icon={<GraduationCap size={20} />} />
        </div>
        <SuperAdminSchoolConsole schools={data.schools ?? []} onRefresh={loadDashboard} />
      </div>
    );
  }

  const sixModuleTiles = (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '1.08rem', color: 'var(--brand-primary)' }}>Quick Access Modules</h2>
      <div className="grid-2">
        <ModuleTile
          title={UI_STRINGS.en.announcements}
          description="School-wide and class announcements"
          to={ROUTES.ANNOUNCEMENTS}
          icon={<Megaphone size={22} />}
        />
        <ModuleTile
          title={UI_STRINGS.en.homework}
          description="Daily assignments, PDFs & study links"
          to={ROUTES.HOMEWORK}
          icon={<BookOpen size={22} />}
        />
        <ModuleTile
          title={UI_STRINGS.en.events}
          description="School calendar, holidays, PTMs & exams"
          to={ROUTES.EVENTS}
          icon={<Calendar size={22} />}
        />
        <ModuleTile
          title={UI_STRINGS.en.notifications}
          description="Urgent alerts & read receipt history"
          to={ROUTES.NOTIFICATIONS}
          badge={data.unreadNotificationsCount ?? data.counts?.unreadNotificationsCount ?? 0}
          icon={<Bell size={22} />}
        />
        <ModuleTile
          title={UI_STRINGS.en.classUpdates}
          description="Daily classroom notes & teacher reminders"
          to={ROUTES.CLASS_UPDATES}
          icon={<Sparkles size={22} />}
        />
        <ModuleTile
          title={UI_STRINGS.en.photosCirculars}
          description="Official circulars & event photo albums"
          to={ROUTES.CIRCULARS}
          icon={<Image size={22} />}
        />
      </div>
    </div>
  );

  // School Admin Dashboard
  if (user.role === 'SCHOOL_ADMIN') {
    return (
      <div>
        <PageHeader
          title={`Welcome, ${user.fullName}`}
          subtitle={`${ROLE_LABELS[user.role]} overview — school communication, attendance & academics`}
        />
        <div className="grid-4">
          <StatCard label="Total Students" value={data.counts?.studentCount ?? 0} icon={<GraduationCap size={20} />} />
          <StatCard label="Teachers" value={data.counts?.teacherCount ?? 0} icon={<Users size={20} />} />
          <StatCard
            label="Classes & Sections"
            value={`${data.counts?.classCount ?? 0} / ${data.counts?.sectionCount ?? 0}`}
            icon={<BookOpen size={20} />}
          />
          <StatCard
            label="Today's Attendance"
            value={`${data.attendanceOverview?.percentage ?? 100}%`}
            subtext={`${data.attendanceOverview?.present ?? 0} present, ${data.attendanceOverview?.absent ?? 0} absent`}
            accent
            icon={<CheckSquare size={20} />}
          />
        </div>

        {sixModuleTiles}

        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>
              Recent Announcements
            </h3>
            {data.recentAnnouncements?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.recentAnnouncements.map((a) => (
                  <div key={a.id} style={{ paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{a.title}</strong>
                      <StatusPill status={a.priority} />
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 3 }}>{a.body}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No announcements posted yet.</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>Upcoming Events</h3>
            {data.upcomingEvents?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.upcomingEvents.map((ev) => (
                  <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{ev.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(ev.eventDate)}</div>
                    </div>
                    <StatusPill status={ev.eventType} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No upcoming events scheduled.</div>
            )}
          </div>
        </div>

        <SchoolAdminControls />
      </div>
    );
  }

  // Teacher / Staff Dashboard
  if (user.role === 'TEACHER') {
    return (
      <div>
        <PageHeader
          title={`Welcome, ${user.fullName}`}
          subtitle="Your assigned classes, subjects, daily attendance, and homework overview"
        />
        <div className="grid-4">
          <StatCard label="Assigned Classes" value={data.assignedClasses?.length ?? 0} icon={<Users size={20} />} />
          <StatCard label="Assigned Subjects" value={data.assignedSubjects?.length ?? 0} icon={<BookOpen size={20} />} />
          <StatCard
            label="Today Marked"
            value={data.dailyAttendance?.total ?? 0}
            subtext={`${data.dailyAttendance?.absent ?? 0} absent today`}
            accent
            icon={<CheckSquare size={20} />}
          />
          <StatCard
            label="Unread Messages"
            value={data.unreadMessagesCount ?? 0}
            subtext={`${data.unreadNotificationsCount ?? 0} unread alerts`}
            icon={<Bell size={20} />}
          />
        </div>

        {sixModuleTiles}

        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>My Assigned Classes</h3>
            {data.assignedClasses?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.assignedClasses.map((cls) => (
                  <div
                    key={cls.sectionId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-muted)',
                      borderRadius: 8,
                    }}
                  >
                    <strong>{cls.label}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {cls.studentCount} students {cls.isClassTeacher ? '• Class Teacher' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No classes assigned yet.</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>Recent Homework Shared</h3>
            {data.recentHomework?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.recentHomework.map((hw) => (
                  <div key={hw.id} style={{ paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                    <strong>{hw.title}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {hw.subject?.name} • {hw.section?.schoolClass?.name} {hw.section?.name} • Due {formatDate(hw.dueDate)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No homework shared yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Parent & Student Dashboard
  const student = data.student;
  return (
    <div>
      <PageHeader
        title={student ? `${student.fullName}'s Dashboard` : `Welcome, ${user.fullName}`}
        subtitle={
          student
            ? `${student.section?.schoolClass?.name ?? ''} - ${student.section?.name ?? ''} • Admission #${student.admissionNo}`
            : 'No student profile linked yet.'
        }
      />

      <div className="grid-4">
        <StatCard
          label="Attendance Rate"
          value={`${data.attendanceSummary?.percentage ?? 100}%`}
          subtext={`${data.attendanceSummary?.present ?? 0} Present • ${data.attendanceSummary?.absent ?? 0} Absent`}
          icon={<CheckSquare size={20} />}
        />
        <StatCard
          label="Academic Average"
          value={`${data.academicPerformance?.averagePercentage ?? 0}%`}
          subtext={`${data.academicPerformance?.latestMarks?.length ?? 0} recent subjects`}
          accent
          icon={<Award size={20} />}
        />
        <StatCard
          label="Recent Homework"
          value={data.homeworkSummary?.length ?? 0}
          subtext="Active assignments"
          icon={<BookOpen size={20} />}
        />
        <StatCard
          label="Unread Alerts"
          value={data.unreadNotificationsCount ?? 0}
          subtext={`${data.unreadMessagesCount ?? 0} unread messages`}
          icon={<Bell size={20} />}
        />
      </div>

      {sixModuleTiles}

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>
            Latest Homework & Study Tasks
          </h3>
          {data.homeworkSummary?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.homeworkSummary.map((hw) => (
                <div key={hw.id} style={{ paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{hw.title}</strong>
                    <StatusPill status={hw.subject?.code ?? 'HW'} />
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {hw.subject?.name} • Due {formatDate(hw.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No homework assigned yet.</div>
          )}
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>
            Recent Marks & Academic Updates
          </h3>
          {data.academicPerformance?.latestMarks?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.academicPerformance.latestMarks.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{m.assessment?.subject?.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {m.assessment?.examTerm?.name} • {m.marksObtained}/{m.assessment?.maxMarks}
                    </div>
                  </div>
                  <StatusPill status={m.isPassed ? m.grade : 'FAIL'} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No marks published yet.</div>
          )}
        </div>
      </div>

      {data.upcomingEvents && data.upcomingEvents.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--brand-primary)' }}>
            <FileText size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Upcoming Events & Holidays
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {data.upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-muted)',
                  minWidth: 220,
                  flex: '1 1 220px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{ev.title}</strong>
                  <StatusPill status={ev.eventType} />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {formatDate(ev.eventDate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

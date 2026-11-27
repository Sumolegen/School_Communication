import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Image,
  Megaphone,
  MessageSquare,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks';
import { RoleCode } from '@/types';

interface NavGroup {
  heading: string;
  items: Array<{ label: string; to: string; icon: React.ReactNode; roles?: RoleCode[] }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: ROUTES.DASHBOARD, icon: <Home size={18} /> }],
  },
  {
    heading: 'Communication',
    items: [
      { label: 'Announcements', to: ROUTES.ANNOUNCEMENTS, icon: <Megaphone size={18} /> },
      { label: 'School Alerts', to: ROUTES.ALERTS, icon: <AlertTriangle size={18} /> },
      { label: 'Homework', to: ROUTES.HOMEWORK, icon: <BookOpen size={18} /> },
      { label: 'Class Updates', to: ROUTES.CLASS_UPDATES, icon: <Sparkles size={18} /> },
      { label: 'Events & Holidays', to: ROUTES.EVENTS, icon: <Calendar size={18} /> },
      { label: 'Circulars', to: ROUTES.CIRCULARS, icon: <FileText size={18} /> },
      { label: 'Photo Gallery', to: ROUTES.PHOTOS, icon: <Image size={18} /> },
      { label: 'Notifications', to: ROUTES.NOTIFICATIONS, icon: <Bell size={18} /> },
      { label: 'Parent Messages', to: ROUTES.PARENT_COMMUNICATION, icon: <MessageSquare size={18} />, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT'] },
    ],
  },
  {
    heading: 'Daily Operations',
    items: [
      { label: 'Attendance', to: ROUTES.ATTENDANCE, icon: <CheckSquare size={18} /> },
      { label: 'Timetable', to: ROUTES.TIMETABLE, icon: <Clock size={18} /> },
    ],
  },
  {
    heading: 'Academics',
    items: [
      { label: 'Marks & Results', to: ROUTES.MARKS, icon: <Award size={18} /> },
      { label: 'Academic Updates', to: ROUTES.ACADEMIC_UPDATES, icon: <GraduationCap size={18} /> },
      { label: 'Report Cards', to: ROUTES.REPORT_CARDS, icon: <FileText size={18} /> },
      { label: 'Term Progress', to: ROUTES.PERFORMANCE, icon: <BarChart3 size={18} /> },
      { label: 'Subjects', to: ROUTES.SUBJECTS, icon: <BookOpen size={18} />, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { label: 'Exams & Terms', to: ROUTES.EXAMS, icon: <Calendar size={18} />, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { label: 'Assessments', to: ROUTES.ASSESSMENTS, icon: <CheckSquare size={18} />, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { label: 'Grade Scales', to: ROUTES.GRADES, icon: <Award size={18} />, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
    ],
  },
  {
    heading: 'Analytics & Directories',
    items: [
      { label: 'Student Analytics', to: ROUTES.ANALYTICS_STUDENT, icon: <BarChart3 size={18} /> },
      { label: 'Subject Analytics', to: ROUTES.ANALYTICS_SUBJECT, icon: <BarChart3 size={18} /> },
      { label: 'Class Analytics', to: ROUTES.ANALYTICS_CLASS, icon: <BarChart3 size={18} />, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { label: 'Attendance Analytics', to: ROUTES.ANALYTICS_ATTENDANCE, icon: <BarChart3 size={18} /> },
      { label: 'Students', to: ROUTES.STUDENTS, icon: <Users size={18} /> },
      { label: 'Staff Directory', to: ROUTES.STAFF, icon: <UserCheck size={18} /> },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { user, school } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={school?.logoUrl || '/default-school-logo.svg'}
            alt={school?.name ?? 'School'}
            style={{ width: 38, height: 38, borderRadius: 8, background: '#fff', objectFit: 'cover' }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {school?.name ?? 'School Communication'}
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.78 }}>
              {school?.schoolCode ? `Code: ${school.schoolCode}` : 'Platform Console'}
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 24px' }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(user.role));
          if (visibleItems.length === 0) return null;
          if (user.role === 'SUPER_ADMIN' && group.heading !== 'Overview') {
            return null;
          }
          return (
            <div key={group.heading} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  opacity: 0.6,
                  padding: '0 10px 6px',
                  fontWeight: 700,
                }}
              >
                {group.heading}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'var(--brand-accent)' : 'transparent',
                      color: '#ffffff',
                      opacity: isActive ? 1 : 0.88,
                    })}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

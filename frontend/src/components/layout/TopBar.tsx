import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { ROLE_LABELS, ROUTES } from '@/constants';
import { useAuth, useNotifications } from '@/hooks';

export const TopBar: React.FC = () => {
  const { user, school, students, activeStudent, setActiveStudentId, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '1.02rem' }}>
          {school?.name ?? 'School Communication'}
        </div>
        {user?.role === 'PARENT' && students.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Child:</span>
            <select
              className="select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem', fontWeight: 600 }}
              value={activeStudent?.id ?? ''}
              onChange={(e) => setActiveStudentId(e.target.value)}
              aria-label="Select active student"
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.fullName} ({stu.section?.schoolClass?.name ?? ''} {stu.section?.name ?? ''})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link
          to={ROUTES.NOTIFICATIONS}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--bg-muted)',
            color: 'var(--brand-primary)',
          }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                padding: '0 4px',
                borderRadius: 999,
                background: 'var(--brand-accent)',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <Link
          to={ROUTES.PROFILE}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Avatar name={user?.fullName ?? 'User'} size={34} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {user ? ROLE_LABELS[user.role] : ''}
            </div>
          </div>
        </Link>

        <Link to={ROUTES.PROFILE} className="btn btn-outline" style={{ padding: '7px 10px' }} title="Profile & Settings">
          <User size={16} />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ padding: '7px 10px' }}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

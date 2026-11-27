import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Home, MessageSquare, Menu } from 'lucide-react';
import { ROUTES } from '@/constants';

export const BottomNav: React.FC = () => {
  const tabs = [
    { label: 'Home', to: ROUTES.DASHBOARD, icon: <Home size={19} /> },
    { label: 'Messages', to: ROUTES.PARENT_COMMUNICATION, icon: <MessageSquare size={19} /> },
    { label: 'Events', to: ROUTES.EVENTS, icon: <Calendar size={19} /> },
    { label: 'More', to: ROUTES.PROFILE, icon: <Menu size={19} /> },
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile quick navigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            fontSize: '0.72rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? 'var(--brand-accent)' : 'var(--text-secondary)',
          })}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-area">
      <TopBar />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
    <BottomNav />
  </div>
);

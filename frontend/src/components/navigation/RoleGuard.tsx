import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/components/cards/LoadingState';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks';
import { RoleCode } from '@/types';

interface RoleGuardProps {
  allowedRoles?: RoleCode[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <LoadingState message="Checking school session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

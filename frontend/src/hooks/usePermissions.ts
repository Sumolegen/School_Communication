import { useCallback } from 'react';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (code: string) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      return user.permissions.includes(code);
    },
    [user],
  );

  return { hasPermission, permissions: user?.permissions ?? [], role: user?.role };
}

import { useContext } from 'react';
import { NotificationsContext, NotificationsContextValue } from '@/state/notifications/NotificationsContext';

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider.');
  return ctx;
}

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { notificationsService } from '@/services/notifications.service';
import { NotificationItem, ToastItem } from '@/types';
import { AuthContext } from '../auth/AuthContext';

export interface NotificationsContextValue {
  unreadCount: number;
  recentNotifications: NotificationItem[];
  toasts: ToastItem[];
  refreshUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  showToast: (type: ToastItem['type'], message: string) => void;
  dismissToast: (id: string) => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const refreshUnreadCount = useCallback(async () => {
    if (!auth?.isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }
    try {
      const res = await notificationsService.list({ limit: 8 });
      setUnreadCount(res.unreadCount);
      setRecentNotifications(res.items);
    } catch {
      // Ignore silent background polling failure
    }
  }, [auth?.isAuthenticated]);

  useEffect(() => {
    void refreshUnreadCount();
    if (!auth?.isAuthenticated) return;
    const timer = window.setInterval(() => {
      void refreshUnreadCount();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [auth?.isAuthenticated, refreshUnreadCount]);

  const markRead = useCallback(async (id: string) => {
    await notificationsService.markRead(id);
    await refreshUnreadCount();
  }, [refreshUnreadCount]);

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead();
    await refreshUnreadCount();
  }, [refreshUnreadCount]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        recentNotifications,
        toasts,
        refreshUnreadCount,
        markRead,
        markAllRead,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

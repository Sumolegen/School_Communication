import { NotificationItem, PaginatedResponse, PriorityLevel } from '@/types';
import { apiClient } from './api';

export const notificationsService = {
  list: async (params?: { unreadOnly?: boolean; priority?: PriorityLevel; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<NotificationItem> & { unreadCount: number }>(
      '/communication/notifications',
      { params },
    );
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await apiClient.get<{ unreadCount: number }>('/communication/notifications/unread-count');
    return data;
  },

  markRead: async (id: string) => {
    await apiClient.post(`/communication/notifications/${id}/read`);
  },

  markAllRead: async () => {
    await apiClient.post('/communication/notifications/read-all');
  },
};

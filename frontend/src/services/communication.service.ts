import {
  AnnouncementItem,
  CircularItem,
  ClassUpdateItem,
  DirectMessageItem,
  EventItem,
  EventType,
  MessageThreadItem,
  PaginatedResponse,
  PhotoAlbumItem,
  PriorityLevel,
  TargetScope,
} from '@/types';
import { apiClient } from './api';

export const communicationService = {
  // Announcements
  listAnnouncements: async (params?: { kind?: 'ANNOUNCEMENT' | 'ALERT'; studentId?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<AnnouncementItem>>('/announcements', { params });
    return data;
  },
  createAnnouncement: async (payload: {
    title: string;
    body: string;
    priority?: PriorityLevel;
    targetScope?: TargetScope;
    sectionIds?: string[];
    studentIds?: string[];
    attachmentFileId?: string;
  }) => {
    const { data } = await apiClient.post<AnnouncementItem>('/announcements', payload);
    return data;
  },
  markAnnouncementRead: async (id: string) => {
    const { data } = await apiClient.post(`/announcements/${id}/read`);
    return data;
  },

  // Alerts
  listAlerts: async (params?: { studentId?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<AnnouncementItem>>('/communication/alerts', { params });
    return data;
  },
  createAlert: async (payload: {
    title: string;
    body: string;
    priority?: PriorityLevel;
    targetScope?: TargetScope;
    sectionIds?: string[];
    studentIds?: string[];
  }) => {
    const { data } = await apiClient.post<AnnouncementItem>('/communication/alerts', payload);
    return data;
  },

  // Events
  listEvents: async (params?: { month?: string; eventType?: EventType; studentId?: string }) => {
    const { data } = await apiClient.get<EventItem[]>('/events', { params });
    return data;
  },
  createEvent: async (payload: {
    title: string;
    description?: string;
    eventType: EventType;
    eventDate: string;
    endDate?: string;
    targetScope?: TargetScope;
    sectionId?: string;
  }) => {
    const { data } = await apiClient.post<EventItem>('/events', payload);
    return data;
  },
  deleteEvent: async (id: string) => {
    await apiClient.delete(`/events/${id}`);
  },

  // Circulars
  listCirculars: async (params?: { search?: string; fromDate?: string; toDate?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<CircularItem>>('/circulars', { params });
    return data;
  },
  createCircular: async (payload: {
    title: string;
    description?: string;
    circularDate: string;
    fileId: string;
    targetScope?: TargetScope;
    sectionId?: string;
  }) => {
    const { data } = await apiClient.post<CircularItem>('/circulars', payload);
    return data;
  },
  deleteCircular: async (id: string) => {
    await apiClient.delete(`/circulars/${id}`);
  },

  // Photos / Gallery
  listPhotoAlbums: async (sectionId?: string) => {
    const { data } = await apiClient.get<PhotoAlbumItem[]>('/gallery', {
      params: sectionId ? { sectionId } : undefined,
    });
    return data;
  },
  createPhotoAlbum: async (payload: {
    title: string;
    description?: string;
    eventDate: string;
    sectionId?: string;
    photos?: Array<{ fileId: string; caption?: string }>;
  }) => {
    const { data } = await apiClient.post<PhotoAlbumItem>('/gallery', payload);
    return data;
  },
  addPhotosToAlbum: async (albumId: string, photos: Array<{ fileId: string; caption?: string }>) => {
    const { data } = await apiClient.post<PhotoAlbumItem>(`/gallery/${albumId}/photos`, { photos });
    return data;
  },

  // Class Updates
  listClassUpdates: async (params?: { sectionId?: string; studentId?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<ClassUpdateItem>>('/communication/class-updates', { params });
    return data;
  },
  createClassUpdate: async (payload: {
    sectionId: string;
    title: string;
    content: string;
    attachmentFileId?: string;
  }) => {
    const { data } = await apiClient.post<ClassUpdateItem>('/communication/class-updates', payload);
    return data;
  },

  // Parent-Teacher Direct Messaging
  listThreads: async (studentId?: string) => {
    const { data } = await apiClient.get<MessageThreadItem[]>('/messages/threads', {
      params: studentId ? { studentId } : undefined,
    });
    return data;
  },
  getMessageContacts: async (studentId?: string) => {
    const { data } = await apiClient.get<
      Array<{
        userId: string;
        fullName: string;
        designation?: string;
        subjects?: string[];
        studentId?: string;
        studentName?: string;
        className?: string;
        relationship?: string;
      }>
    >('/messages/contacts', { params: studentId ? { studentId } : undefined });
    return data;
  },
  getThreadMessages: async (threadId: string) => {
    const { data } = await apiClient.get<{ thread: MessageThreadItem; messages: DirectMessageItem[] }>(
      `/messages/threads/${threadId}`,
    );
    return data;
  },
  markThreadRead: async (threadId: string) => {
    await apiClient.post(`/messages/threads/${threadId}/read`);
  },
  sendMessage: async (payload: {
    threadId?: string;
    studentId?: string;
    receiverUserId?: string;
    body: string;
    attachmentFileId?: string;
  }) => {
    const { data } = await apiClient.post<DirectMessageItem>('/messages/send', payload);
    return data;
  },
};

import { HomeworkItem, PaginatedResponse } from '@/types';
import { readOfflineCache, saveOfflineCache } from '@/utils';
import { apiClient } from './api';

export const homeworkService = {
  list: async (params?: { sectionId?: string; subjectId?: string; studentId?: string; date?: string; page?: number }) => {
    const cacheKey = `homework_${params?.studentId ?? params?.sectionId ?? 'all'}`;
    try {
      const { data } = await apiClient.get<PaginatedResponse<HomeworkItem>>('/homework', { params });
      saveOfflineCache(cacheKey, data);
      return { data, fromOfflineCache: false };
    } catch (err) {
      const cached = readOfflineCache<PaginatedResponse<HomeworkItem>>(cacheKey, 14);
      if (cached) {
        return { data: cached.data, fromOfflineCache: true, cachedAt: cached.savedAt };
      }
      throw err;
    }
  },

  create: async (payload: {
    sectionId: string;
    subjectId: string;
    title: string;
    instructions: string;
    assignedDate?: string;
    dueDate: string;
    attachmentFileIds?: string[];
    externalLinks?: Array<{ label: string; url: string }>;
  }) => {
    const { data } = await apiClient.post<HomeworkItem>('/homework', payload);
    return data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/homework/${id}`);
  },
};

import { DayOfWeek, TimetableEntryItem } from '@/types';
import { readOfflineCache, saveOfflineCache } from '@/utils';
import { apiClient } from './api';

export const timetableService = {
  getSchedule: async (sectionId?: string) => {
    const cacheKey = `timetable_${sectionId ?? 'me'}`;
    try {
      const { data } = await apiClient.get<TimetableEntryItem[]>('/timetable', {
        params: sectionId ? { sectionId } : undefined,
      });
      saveOfflineCache(cacheKey, data);
      return data;
    } catch (err) {
      const cached = readOfflineCache<TimetableEntryItem[]>(cacheKey, 14);
      if (cached) return cached.data;
      throw err;
    }
  },

  upsertEntry: async (payload: {
    sectionId: string;
    dayOfWeek: DayOfWeek;
    periodNo: number;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherStaffId: string;
  }) => {
    const { data } = await apiClient.post<TimetableEntryItem>('/timetable', payload);
    return data;
  },

  removeEntry: async (id: string) => {
    await apiClient.delete(`/timetable/${id}`);
  },
};

import { DashboardSummaryResponse } from '@/types';
import { apiClient } from './api';

export const dashboardService = {
  getSummary: async (studentId?: string) => {
    const { data } = await apiClient.get<DashboardSummaryResponse>('/dashboard', {
      params: studentId ? { studentId } : undefined,
    });
    return data;
  },
};

import {
  AttendancePerformanceResponse,
  ClassPerformanceItem,
  StudentAnalyticsResponse,
  SubjectPerformanceItem,
} from '@/types';
import { apiClient } from './api';

export const analyticsService = {
  getStudentPerformance: async (studentId?: string) => {
    const { data } = await apiClient.get<StudentAnalyticsResponse>('/analytics/student-performance', {
      params: studentId ? { studentId } : undefined,
    });
    return data;
  },

  getSubjectPerformance: async (sectionId?: string) => {
    const { data } = await apiClient.get<SubjectPerformanceItem[]>('/analytics/subject-performance', {
      params: sectionId ? { sectionId } : undefined,
    });
    return data;
  },

  getClassPerformance: async (examTermId?: string) => {
    const { data } = await apiClient.get<ClassPerformanceItem[]>('/analytics/class-performance', {
      params: examTermId ? { examTermId } : undefined,
    });
    return data;
  },

  getAttendancePerformance: async (month?: string) => {
    const { data } = await apiClient.get<AttendancePerformanceResponse>('/analytics/attendance-performance', {
      params: month ? { month } : undefined,
    });
    return data;
  },
};

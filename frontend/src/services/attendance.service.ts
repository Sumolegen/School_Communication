import { AttendanceRosterItem, AttendanceStatus, StudentAttendanceResponse } from '@/types';
import { apiClient } from './api';

export const attendanceService = {
  getRoster: async (sectionId: string, date?: string) => {
    const { data } = await apiClient.get<{
      sectionId: string;
      date: string;
      alreadySubmitted: boolean;
      students: AttendanceRosterItem[];
    }>('/attendance/roster', { params: { sectionId, date } });
    return data;
  },

  markBulk: async (payload: {
    sectionId: string;
    date: string;
    records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>;
  }) => {
    const { data } = await apiClient.post<{
      date: string;
      savedCount: number;
      absentCount: number;
      absenceAlertsSent: number;
    }>('/attendance/bulk', payload);
    return data;
  },

  getStudentAttendance: async (studentId: string, month?: string) => {
    const { data } = await apiClient.get<StudentAttendanceResponse>('/attendance', {
      params: { studentId, month },
    });
    return data;
  },

  getReport: async (params?: { sectionId?: string; month?: string }) => {
    const { data } = await apiClient.get<{
      month: string;
      overallPercentage: number;
      totals: { present: number; absent: number; late: number; leave: number; total: number };
      students: Array<{
        studentId: string;
        fullName: string;
        admissionNo: string;
        sectionName: string;
        present: number;
        absent: number;
        late: number;
        leave: number;
        total: number;
        percentage: number;
      }>;
    }>('/attendance/reports', { params });
    return data;
  },
};

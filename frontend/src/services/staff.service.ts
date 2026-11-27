import { PaginatedResponse, StaffAssignment, StaffMember } from '@/types';
import { apiClient } from './api';

export const staffService = {
  listStaff: async (params?: { search?: string; teachersOnly?: boolean; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<StaffMember>>('/staff', { params });
    return data;
  },

  createStaff: async (payload: {
    fullName: string;
    phone: string;
    email?: string;
    employeeCode: string;
    designation: string;
    qualification?: string;
    isTeacher?: boolean;
    pinOrPassword?: string;
  }) => {
    const { data } = await apiClient.post<StaffMember>('/staff', payload);
    return data;
  },

  listAssignments: async (params?: { staffId?: string; sectionId?: string }) => {
    const { data } = await apiClient.get<StaffAssignment[]>('/staff/assignments', { params });
    return data;
  },

  getMyAssignments: async () => {
    const { data } = await apiClient.get<StaffAssignment[]>('/staff/assignments/me');
    return data;
  },

  createAssignment: async (payload: {
    staffId: string;
    sectionId: string;
    subjectId?: string;
    isClassTeacher?: boolean;
  }) => {
    const { data } = await apiClient.post<StaffAssignment>('/staff/assignments', payload);
    return data;
  },

  deleteAssignment: async (id: string) => {
    await apiClient.delete(`/staff/assignments/${id}`);
  },
};

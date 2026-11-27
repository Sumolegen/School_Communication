import { ClassSection, PaginatedResponse, SchoolClass, StudentRecord } from '@/types';
import { apiClient } from './api';

export const studentsService = {
  listClasses: async () => {
    const { data } = await apiClient.get<SchoolClass[]>('/students/classes');
    return data;
  },
  listSections: async () => {
    const { data } = await apiClient.get<ClassSection[]>('/students/classes/sections');
    return data;
  },
  createClass: async (payload: { name: string; displayOrder?: number }) => {
    const { data } = await apiClient.post<SchoolClass>('/students/classes', payload);
    return data;
  },
  createSection: async (payload: { classId: string; name: string; classTeacherId?: string }) => {
    const { data } = await apiClient.post<ClassSection>('/students/classes/sections', payload);
    return data;
  },
  listStudents: async (params?: { sectionId?: string; search?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<StudentRecord>>('/students/profiles', { params });
    return data;
  },
  getStudent: async (id: string) => {
    const { data } = await apiClient.get<StudentRecord>(`/students/profiles/${id}`);
    return data;
  },
  createStudent: async (payload: {
    admissionNo: string;
    fullName: string;
    sectionId: string;
    rollNo?: string;
    gender?: string;
    bloodGroup?: string;
    guardianPhone?: string;
    parentFullName?: string;
    parentPin?: string;
    address?: string;
  }) => {
    const { data } = await apiClient.post<StudentRecord>('/students/profiles', payload);
    return data;
  },
  listParents: async () => {
    const { data } = await apiClient.get<
      PaginatedResponse<{ id: string; fullName: string; phone: string; email?: string | null }>
    >('/users', { params: { roleCode: 'PARENT', limit: 100 } });
    return data.items;
  },
  linkParent: async (studentId: string, payload: {
    parentPhone: string;
    parentFullName: string;
    relationship?: 'FATHER' | 'MOTHER' | 'GUARDIAN';
    parentPin?: string;
  }) => {
    const { data } = await apiClient.post(`/students/profiles/${studentId}/parents`, payload);
    return data;
  },
};

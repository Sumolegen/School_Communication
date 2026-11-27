import { AcademicYear, RoleCode, SchoolConfig } from '@/types';
import { apiClient } from './api';

export const schoolService = {
  getPublicConfig: async (schoolCode?: string) => {
    const { data } = await apiClient.get<SchoolConfig>('/school/config', {
      params: schoolCode ? { schoolCode } : undefined,
    });
    return data;
  },

  listSchools: async () => {
    const { data } = await apiClient.get<SchoolConfig[]>('/school');
    return data;
  },

  createSchool: async (payload: {
    schoolCode: string;
    name: string;
    primaryColor?: string;
    accentColor?: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    adminFullName?: string;
    adminPhone?: string;
    adminPassword?: string;
  }) => {
    const { data } = await apiClient.post<SchoolConfig>('/school', payload);
    return data;
  },

  updateSchool: async (id: string, payload: Partial<SchoolConfig>) => {
    const { data } = await apiClient.patch<SchoolConfig>(`/school/${id}`, payload);
    return data;
  },

  listAcademicYears: async () => {
    const { data } = await apiClient.get<AcademicYear[]>('/academic-years');
    return data;
  },

  createAcademicYear: async (payload: {
    name: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
  }) => {
    const { data } = await apiClient.post<AcademicYear>('/academic-years', payload);
    return data;
  },

  setCurrentAcademicYear: async (id: string) => {
    const { data } = await apiClient.patch<AcademicYear>(`/academic-years/${id}`, { isCurrent: true });
    return data;
  },

  listPermissionsCatalog: async () => {
    const { data } = await apiClient.get<Array<{ id: string; code: string; module: string; description?: string }>>(
      '/permissions',
    );
    return data;
  },

  listSchoolOverrides: async () => {
    const { data } = await apiClient.get<
      Array<{
        id: string;
        granted: boolean;
        role: { code: RoleCode; name: string };
        permission: { code: string; description?: string };
      }>
    >('/permissions/school-overrides');
    return data;
  },

  upsertPermissionOverride: async (payload: {
    roleCode: RoleCode;
    permissionCode: string;
    granted: boolean;
  }) => {
    const { data } = await apiClient.put('/permissions/school-overrides', payload);
    return data;
  },
};

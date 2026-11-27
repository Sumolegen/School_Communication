import { LoginPayload, OtpRequestPayload, OtpVerifyPayload, SchoolConfig, StudentRecord, UserSession } from '@/types';
import { apiClient } from './api';

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  redirectPath: string;
  user: UserSession;
  school: SchoolConfig | null;
  students: StudentRecord[];
}

export const authService = {
  requestOtp: async (payload: OtpRequestPayload) => {
    const { data } = await apiClient.post<{
      message: string;
      expiresInMinutes: number;
      schoolCode?: string | null;
      devOtp?: string;
    }>('/auth/request-otp', payload);
    return data;
  },

  verifyOtp: async (payload: OtpVerifyPayload) => {
    const { data } = await apiClient.post<AuthSessionResponse>('/auth/verify-otp', payload);
    return data;
  },

  loginWithPin: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<AuthSessionResponse>('/auth/login', payload);
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get<{
      user: UserSession;
      school: SchoolConfig | null;
      students: StudentRecord[];
    }>('/auth/me');
    return data;
  },

  getMyStudents: async () => {
    const { data } = await apiClient.get<StudentRecord[]>('/me/students');
    return data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  updateOwnProfile: async (payload: {
    fullName?: string;
    email?: string;
    newPinOrPassword?: string;
  }) => {
    const { data } = await apiClient.patch('/users/me', payload);
    return data;
  },

  requestDeletion: async () => {
    const { data } = await apiClient.post('/users/me/deletion-request');
    return data;
  },
};

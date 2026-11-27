export type RoleCode = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface UserSession {
  id: string;
  schoolId: string | null;
  phone: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: RoleCode;
  permissions: string[];
  staffId?: string | null;
  studentId?: string | null;
}

export interface LoginPayload {
  schoolCode?: string;
  phone: string;
  pinOrPassword: string;
}

export interface OtpRequestPayload {
  schoolCode?: string;
  phone: string;
}

export interface OtpVerifyPayload {
  schoolCode?: string;
  phone: string;
  otp: string;
}

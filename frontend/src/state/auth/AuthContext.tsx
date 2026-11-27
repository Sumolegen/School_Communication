import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService, AuthSessionResponse } from '@/services/auth.service';
import {
  LoginPayload,
  OtpVerifyPayload,
  RegisterSchoolPayload,
  RegisterUserPayload,
  SchoolConfig,
  StudentRecord,
  UserSession,
} from '@/types';
import { applySchoolTheme, tokenStorage } from '@/utils';

export interface AuthContextValue {
  user: UserSession | null;
  school: SchoolConfig | null;
  students: StudentRecord[];
  activeStudent: StudentRecord | null;
  loading: boolean;
  isAuthenticated: boolean;
  setActiveStudentId: (studentId: string) => void;
  loginWithPin: (payload: LoginPayload) => Promise<AuthSessionResponse>;
  verifyOtp: (payload: OtpVerifyPayload) => Promise<AuthSessionResponse>;
  signupUser: (payload: RegisterUserPayload) => Promise<AuthSessionResponse>;
  signupSchool: (payload: RegisterSchoolPayload) => Promise<AuthSessionResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setSchoolConfig: (school: SchoolConfig) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [school, setSchool] = useState<SchoolConfig | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [activeStudentId, setActiveStudentIdState] = useState<string | null>(tokenStorage.getActiveStudentId());
  const [loading, setLoading] = useState<boolean>(true);

  const applySessionPayload = useCallback(
    (payload: { user: UserSession; school: SchoolConfig | null; students: StudentRecord[] }) => {
      setUser(payload.user);
      setSchool(payload.school);
      setStudents(payload.students);
      applySchoolTheme(payload.school?.primaryColor, payload.school?.accentColor);

      const stored = tokenStorage.getActiveStudentId();
      const matched = payload.students.find((s) => s.id === stored) ?? payload.students[0] ?? null;
      if (matched) {
        setActiveStudentIdState(matched.id);
        tokenStorage.setActiveStudentId(matched.id);
      } else {
        setActiveStudentIdState(null);
      }
    },
    [],
  );

  const refreshSession = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      applySchoolTheme('#0F294A', '#D97706');
      setLoading(false);
      return;
    }
    try {
      const me = await authService.getMe();
      applySessionPayload(me);
    } catch {
      tokenStorage.clearTokens();
      setUser(null);
      setSchool(null);
      setStudents([]);
      applySchoolTheme('#0F294A', '#D97706');
    } finally {
      setLoading(false);
    }
  }, [applySessionPayload]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const setActiveStudentId = useCallback((studentId: string) => {
    setActiveStudentIdState(studentId);
    tokenStorage.setActiveStudentId(studentId);
  }, []);

  const loginWithPin = useCallback(
    async (payload: LoginPayload) => {
      const res = await authService.loginWithPin(payload);
      tokenStorage.setTokens(res.accessToken, res.refreshToken);
      applySessionPayload(res);
      return res;
    },
    [applySessionPayload],
  );

  const verifyOtp = useCallback(
    async (payload: OtpVerifyPayload) => {
      const res = await authService.verifyOtp(payload);
      tokenStorage.setTokens(res.accessToken, res.refreshToken);
      applySessionPayload(res);
      return res;
    },
    [applySessionPayload],
  );

  const signupUser = useCallback(
    async (payload: RegisterUserPayload) => {
      const res = await authService.signupUser(payload);
      tokenStorage.setTokens(res.accessToken, res.refreshToken);
      applySessionPayload(res);
      return res;
    },
    [applySessionPayload],
  );

  const signupSchool = useCallback(
    async (payload: RegisterSchoolPayload) => {
      const res = await authService.signupSchool(payload);
      tokenStorage.setTokens(res.accessToken, res.refreshToken);
      applySessionPayload(res);
      return res;
    },
    [applySessionPayload],
  );

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.getAccessToken()) {
        await authService.logout();
      }
    } catch {
      // Clear local session regardless of network errors
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setSchool(null);
      setStudents([]);
      setActiveStudentIdState(null);
      applySchoolTheme('#0F294A', '#D97706');
    }
  }, []);

  const setSchoolConfig = useCallback((updated: SchoolConfig) => {
    setSchool(updated);
    applySchoolTheme(updated.primaryColor, updated.accentColor);
  }, []);

  const activeStudent = useMemo(
    () => students.find((s) => s.id === activeStudentId) ?? students[0] ?? null,
    [students, activeStudentId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      school,
      students,
      activeStudent,
      loading,
      isAuthenticated: Boolean(user),
      setActiveStudentId,
      loginWithPin,
      verifyOtp,
      signupUser,
      signupSchool,
      logout,
      refreshSession,
      setSchoolConfig,
    }),
    [user, school, students, activeStudent, loading, setActiveStudentId, loginWithPin, verifyOtp, signupUser, signupSchool, logout, refreshSession, setSchoolConfig],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

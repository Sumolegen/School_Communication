const TOKEN_KEY = 'sc_access_token';
const REFRESH_KEY = 'sc_refresh_token';
const ACTIVE_STUDENT_KEY = 'sc_active_student_id';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ACTIVE_STUDENT_KEY);
  },
  getActiveStudentId: () => localStorage.getItem(ACTIVE_STUDENT_KEY),
  setActiveStudentId: (studentId: string) => localStorage.setItem(ACTIVE_STUDENT_KEY, studentId),
};

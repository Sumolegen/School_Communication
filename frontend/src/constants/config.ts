export const APP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'School Communication',
  DEFAULT_PRIMARY_COLOR: '#0F294A',
  DEFAULT_ACCENT_COLOR: '#D97706',
  OFFLINE_CACHE_DAYS: 14,
} as const;

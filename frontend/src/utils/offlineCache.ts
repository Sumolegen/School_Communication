import { APP_CONFIG } from '@/constants';

interface CachedEntry<T> {
  savedAt: number;
  data: T;
}

export function saveOfflineCache<T>(key: string, data: T): void {
  try {
    const payload: CachedEntry<T> = { savedAt: Date.now(), data };
    localStorage.setItem(`sc_cache_${key}`, JSON.stringify(payload));
  } catch {
    // Ignore storage quota issues cleanly
  }
}

export function readOfflineCache<T>(key: string, maxDays = APP_CONFIG.OFFLINE_CACHE_DAYS): { data: T; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(`sc_cache_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.savedAt > maxAgeMs) {
      localStorage.removeItem(`sc_cache_${key}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

import { useCallback, useState } from 'react';

const PREFIX = 'lk-';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* private mode or storage full – settings just aren't remembered */
  }
}

/** useState that is remembered across visits. Objects are merged with the fallback so new keys get defaults. */
export function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = load<T>(key, fallback);
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback) && stored && typeof stored === 'object') {
      return { ...fallback, ...stored };
    }
    return stored;
  });
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        save(key, next);
        return next;
      });
    },
    [key],
  );
  return [value, set];
}

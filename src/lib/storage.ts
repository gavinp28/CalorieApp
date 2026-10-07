import { useEffect, useState } from 'react';

// localStorage wrapper that never throws (private mode, blocked storage, quota).
const PREFIX = 'cd1:';
const EVENT = 'cd1:storage';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

/** Reads a stored value and re-renders when it's saved (in this tab or another). */
export function useStored<T>(key: string, fallback: T): T {
  const [value, setValue] = useState(() => load(key, fallback));
  useEffect(() => {
    setValue(load(key, fallback));
    const onLocal = (e: Event) => (e as CustomEvent<string>).detail === key && setValue(load(key, fallback));
    const onOther = (e: StorageEvent) => e.key === PREFIX + key && setValue(load(key, fallback));
    window.addEventListener(EVENT, onLocal);
    window.addEventListener('storage', onOther);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener('storage', onOther);
    };
    // fallback is a fresh literal each render; only the key matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return value;
}

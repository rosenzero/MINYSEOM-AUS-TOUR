'use client';

import { useEffect, useState } from 'react';
import type { DisplayTzMode } from './timezone';
import { TZ_AU, TZ_KR } from './timezone';

const KEY = 'aus-tour:display-tz-mode';
const EVT = 'aus-tour:display-tz-mode:change';

export function getTzMode(): DisplayTzMode {
  if (typeof window === 'undefined') return 'auto';
  const v = window.localStorage.getItem(KEY);
  return v === 'kr' || v === 'au' || v === 'auto' ? v : 'auto';
}

export function setTzMode(mode: DisplayTzMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, mode);
  window.dispatchEvent(new Event(EVT));
}

export function onTzModeChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function resolveTz(
  mode: DisplayTzMode,
  now: Date,
  auStartUtcMs: number
): string {
  if (mode === 'kr') return TZ_KR;
  if (mode === 'au') return TZ_AU;
  return now.getTime() >= auStartUtcMs ? TZ_AU : TZ_KR;
}

export function useTzMode(): DisplayTzMode {
  const [mode, setMode] = useState<DisplayTzMode>('auto');
  useEffect(() => {
    setMode(getTzMode());
    return onTzModeChange(() => setMode(getTzMode()));
  }, []);
  return mode;
}

'use client';

import { useEffect, useState } from 'react';

const KEY = 'aus-tour:memos';
const EVT = 'aus-tour:memo:change';

export type MemoMap = Record<string, string>;

function readAll(): MemoMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as MemoMap;
    return {};
  } catch {
    return {};
  }
}

function writeAll(next: MemoMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVT));
}

export function getMemo(uid: string): string {
  return readAll()[uid] ?? '';
}

export function setMemo(uid: string, text: string) {
  const all = readAll();
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    delete all[uid];
  } else {
    all[uid] = text;
  }
  writeAll(all);
}

export function clearMemo(uid: string) {
  const all = readAll();
  if (uid in all) {
    delete all[uid];
    writeAll(all);
  }
}

export function onMemoChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useMemo(uid: string): string {
  const [value, setValue] = useState<string>('');
  useEffect(() => {
    setValue(getMemo(uid));
    return onMemoChange(() => setValue(getMemo(uid)));
  }, [uid]);
  return value;
}

export function useAllMemos(): MemoMap {
  const [map, setMap] = useState<MemoMap>({});
  useEffect(() => {
    setMap(readAll());
    return onMemoChange(() => setMap(readAll()));
  }, []);
  return map;
}

export function hasMemo(uid: string, all?: MemoMap): boolean {
  const source = all ?? readAll();
  const v = source[uid];
  return typeof v === 'string' && v.trim().length > 0;
}

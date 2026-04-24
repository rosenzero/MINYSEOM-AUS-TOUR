'use client';

import { useEffect, useState } from 'react';

const KEY = 'aus-tour:fx-rate';
const LAST_KEY = 'aus-tour:fx-last';
const SRC_KEY = 'aus-tour:fx-source';
const EVT = 'aus-tour:fx:change';

export const DEFAULT_AUD_KRW = Number(
  process.env.NEXT_PUBLIC_DEFAULT_AUD_KRW ?? 1055
);

export type FxSource = 'default' | 'manual' | 'live';

export interface FxState {
  rate: number;
  updatedAt: number | null;
  source: FxSource;
}

function readRate(): number {
  if (typeof window === 'undefined') return DEFAULT_AUD_KRW;
  const v = Number(window.localStorage.getItem(KEY));
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_AUD_KRW;
}

function readUpdatedAt(): number | null {
  if (typeof window === 'undefined') return null;
  const v = Number(window.localStorage.getItem(LAST_KEY));
  return Number.isFinite(v) && v > 0 ? v : null;
}

function readSource(): FxSource {
  if (typeof window === 'undefined') return 'default';
  const v = window.localStorage.getItem(SRC_KEY);
  if (v === 'manual' || v === 'live' || v === 'default') return v;
  return 'default';
}

function emit() {
  window.dispatchEvent(new Event(EVT));
}

export function getFxRate(): number {
  return readRate();
}

export function getFxUpdatedAt(): number | null {
  return readUpdatedAt();
}

export function getFxSource(): FxSource {
  return readSource();
}

export function setFxRate(rate: number, source: FxSource = 'manual') {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, String(rate));
  window.localStorage.setItem(LAST_KEY, String(Date.now()));
  window.localStorage.setItem(SRC_KEY, source);
  emit();
}

export function resetFxRate() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(LAST_KEY);
  window.localStorage.removeItem(SRC_KEY);
  emit();
}

export function onFxChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}

export interface LiveFxResult {
  rate: number;
  providerUpdatedAt: number | null;
}

export async function fetchLiveAudKrw(
  signal?: AbortSignal
): Promise<LiveFxResult> {
  const res = await fetch('https://open.er-api.com/v6/latest/AUD', {
    signal,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`fx http ${res.status}`);
  const data = (await res.json()) as {
    result?: string;
    rates?: Record<string, number>;
    time_last_update_unix?: number;
  };
  const rate = data?.rates?.KRW;
  if (data.result !== 'success' || !Number.isFinite(rate) || !rate) {
    throw new Error('fx bad payload');
  }
  return {
    rate,
    providerUpdatedAt:
      typeof data.time_last_update_unix === 'number'
        ? data.time_last_update_unix * 1000
        : null,
  };
}

export function useFx(): FxState {
  const [state, setState] = useState<FxState>({
    rate: DEFAULT_AUD_KRW,
    updatedAt: null,
    source: 'default',
  });
  useEffect(() => {
    const read = () =>
      setState({
        rate: getFxRate(),
        updatedAt: getFxUpdatedAt(),
        source: getFxSource(),
      });
    read();
    return onFxChange(read);
  }, []);
  return state;
}

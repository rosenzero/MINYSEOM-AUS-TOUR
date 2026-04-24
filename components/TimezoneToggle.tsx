'use client';

import { useEffect, useState } from 'react';
import { getTzMode, setTzMode, resolveTz } from '@/lib/tzState';
import { onTzModeChange } from '@/lib/tzState';
import { TZ_AU, TZ_KR, tzAbbr } from '@/lib/timezone';
import type { DisplayTzMode } from '@/lib/timezone';
import { getAuStartUtcMs } from '@/lib/trip';
import { useNow } from '@/lib/useNow';

export function TimezoneToggle() {
  const [mode, setMode] = useState<DisplayTzMode>('auto');
  const [mounted, setMounted] = useState(false);
  const now = useNow();
  const auStart = getAuStartUtcMs();

  useEffect(() => {
    setMounted(true);
    setMode(getTzMode());
    return onTzModeChange(() => setMode(getTzMode()));
  }, []);

  const effectiveTz = resolveTz(mode, now, auStart);
  const autoLabel =
    now.getTime() >= auStart ? tzAbbr(TZ_AU) : tzAbbr(TZ_KR);

  const pick = (m: DisplayTzMode) => setTzMode(m);

  const base =
    'rounded-full px-2.5 py-1 text-[11px] font-medium transition';
  const on =
    'bg-white text-indigo-700 shadow-sm dark:bg-indigo-500 dark:text-white';
  const off =
    'text-white/80 hover:text-white dark:text-neutral-300 dark:hover:text-white';

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full bg-white/15 p-0.5 ring-1 ring-white/20 backdrop-blur-sm dark:bg-neutral-800/70 dark:ring-neutral-700"
      role="group"
      aria-label="표시 시간대"
    >
      <button
        type="button"
        onClick={() => pick('auto')}
        className={[base, mode === 'auto' ? on : off].join(' ')}
        aria-pressed={mode === 'auto'}
        title={mounted ? `자동 · 현재 ${autoLabel}` : '자동'}
      >
        자동
      </button>
      <button
        type="button"
        onClick={() => pick('kr')}
        className={[base, mode === 'kr' ? on : off].join(' ')}
        aria-pressed={mode === 'kr'}
      >
        한국
      </button>
      <button
        type="button"
        onClick={() => pick('au')}
        className={[base, mode === 'au' ? on : off].join(' ')}
        aria-pressed={mode === 'au'}
      >
        호주
      </button>
      <span
        aria-hidden
        className="ml-1 mr-1 shrink-0 text-[10px] font-semibold tracking-wider text-white/70 dark:text-neutral-400"
      >
        {mounted ? tzAbbr(effectiveTz) : ''}
      </span>
    </div>
  );
}

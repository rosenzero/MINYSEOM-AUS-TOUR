'use client';

import Link from 'next/link';
import { useNow } from '@/lib/useNow';
import { useDisplayTz } from '@/lib/useDisplayTz';
import { formatTimeInTz, tzAbbr } from '@/lib/timezone';
import { getEventTz } from '@/lib/timezone';
import { LocationActions } from './LocationActions';
import { MapPinIcon } from './Icons';
import { MemoEditor } from './MemoEditor';

function fmtRel(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  const phrase =
    hr > 0 ? `${hr}시간 ${remMin}분` : `${min}분`;
  if (diff > 0) return `${phrase} 후 시작`;
  return `${phrase} 전 시작`;
}

export function EventDetail(props: {
  uid: string;
  dayLabel: string;
  dayIdx: number;
  title: string;
  location: string;
  start: string;
  end: string;
  startISO: string;
  endISO: string;
}) {
  const now = useNow();
  const displayTz = useDisplayTz();
  const sourceTz = getEventTz(props.dayIdx);
  const startDate = new Date(props.startISO);
  const endDate = new Date(props.endISO);
  const dispStart = formatTimeInTz(startDate, displayTz);
  const dispEnd = formatTimeInTz(endDate, displayTz);
  const isCrossTz = displayTz !== sourceTz;
  const localStart = formatTimeInTz(startDate, sourceTz);
  const localEnd = formatTimeInTz(endDate, sourceTz);
  const t = now.getTime();
  const status: 'past' | 'current' | 'upcoming' =
    t < startDate.getTime()
      ? 'upcoming'
      : t > endDate.getTime()
      ? 'past'
      : 'current';

  const statusBadge = {
    past: { text: '지난 일정', cls: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300' },
    current: { text: '진행중', cls: 'bg-indigo-500 text-white' },
    upcoming: { text: '예정', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  }[status];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-10 bg-white/85 px-4 py-3 backdrop-blur-md dark:bg-neutral-950/85">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
            aria-label="뒤로"
          >
            ‹
          </Link>
          <span className="text-sm font-medium text-neutral-500">
            DAY {props.dayIdx + 1} · {props.dayLabel}
          </span>
        </div>
      </header>

      <main className="px-5 pb-32 pt-4">
        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wider',
            statusBadge.cls,
          ].join(' ')}
        >
          {statusBadge.text}
        </span>

        <h1 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-neutral-900 dark:text-white">
          {props.title}
        </h1>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
          <div className="flex items-baseline gap-2">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-neutral-400">
              TIME
            </p>
            <span className="text-[10px] font-bold tracking-wider text-indigo-500">
              {tzAbbr(displayTz)}
            </span>
          </div>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">
            {dispStart}
            <span className="mx-2 text-neutral-300">–</span>
            {dispEnd}
          </p>
          {isCrossTz && (
            <p className="mt-1 font-mono text-xs tabular-nums text-neutral-400">
              {tzAbbr(sourceTz)}: {localStart} – {localEnd} <span className="text-neutral-300">(현지)</span>
            </p>
          )}
          <p className="mt-2 text-sm text-neutral-500">
            {status === 'current'
              ? '지금 진행 중이에요'
              : fmtRel(status === 'past' ? endDate : startDate, now)}
          </p>
        </div>

        {props.location && (
          <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-neutral-400">
              LOCATION
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-base font-medium text-neutral-900 dark:text-white">
              <MapPinIcon size={16} className="shrink-0 text-rose-500" />
              {props.location}
            </p>
            <LocationActions location={props.location} />
          </div>
        )}

        <MemoEditor uid={props.uid} />
      </main>
    </div>
  );
}

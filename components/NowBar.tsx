'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  getAllEventsSorted,
  getAuStartUtcMs,
  getCurrentEvent,
  getNextEvent,
} from '@/lib/trip';
import { formatTimeInTz } from '@/lib/timezone';
import { getTzMode, onTzModeChange, resolveTz } from '@/lib/tzState';
import { getNow } from '@/lib/useNow';
import type { ResolvedTripEvent } from '@/lib/types';

function fmtDur(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60000));
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr <= 0) return `${min}분`;
  if (remMin === 0) return `${hr}시간`;
  return `${hr}시간 ${remMin}분`;
}

function fmtDays(ms: number): { days: number; hours: number } {
  const totalHours = Math.max(0, Math.floor(ms / 3_600_000));
  return { days: Math.floor(totalHours / 24), hours: totalHours % 24 };
}

type State =
  | { kind: 'pre'; days: number; hours: number; firstTitle: string }
  | { kind: 'post' }
  | {
      kind: 'current';
      event: ResolvedTripEvent;
      next: ResolvedTripEvent | null;
      ratio: number;
      elapsedMs: number;
      remainMs: number;
    }
  | { kind: 'next'; event: ResolvedTripEvent; remainMs: number }
  | { kind: 'empty' };

function computeState(now: Date): State {
  const all = getAllEventsSorted();
  if (all.length === 0) return { kind: 'empty' };
  const tripStart = all[0].startDate.getTime();
  const tripEnd = all[all.length - 1].endDate.getTime();
  const t = now.getTime();

  if (t < tripStart) {
    const { days, hours } = fmtDays(tripStart - t);
    return { kind: 'pre', days, hours, firstTitle: all[0].title };
  }
  if (t > tripEnd) return { kind: 'post' };

  const current = getCurrentEvent(now);
  if (current) {
    const total = current.endDate.getTime() - current.startDate.getTime();
    const elapsedMs = t - current.startDate.getTime();
    const remainMs = current.endDate.getTime() - t;
    const ratio = total > 0 ? Math.min(1, Math.max(0, elapsedMs / total)) : 1;
    const nextAfter = getNextEvent(now);
    return {
      kind: 'current',
      event: current,
      next: nextAfter,
      ratio,
      elapsedMs,
      remainMs,
    };
  }
  const next = getNextEvent(now);
  if (next) {
    return { kind: 'next', event: next, remainMs: next.startDate.getTime() - t };
  }
  return { kind: 'empty' };
}

export function NowBar() {
  // start as null on both server and client → matches on hydration
  const [now, setNow] = useState<Date | null>(null);
  const [mode, setMode] = useState(getTzMode);

  useEffect(() => {
    setNow(getNow());
    const tick = () => setNow(getNow());
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 30_000);
    }, msToNextMinute);
    const unsubTz = onTzModeChange(() => setMode(getTzMode()));
    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== undefined) clearInterval(intervalId);
      unsubTz();
    };
  }, []);

  const displayTz = useMemo(
    () => (now ? resolveTz(mode, now, getAuStartUtcMs()) : null),
    [mode, now]
  );
  const state = useMemo(() => (now ? computeState(now) : null), [now]);

  // skeleton — same on server and first client render
  if (!state) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-safe-bottom"
      >
        <div className="mx-auto mb-3 h-[60px] max-w-md rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/50" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-safe-bottom">
      <div className="pointer-events-auto mx-auto mb-3 max-w-md animate-fade-up">
        <NowBarBody state={state} tz={displayTz ?? 'Asia/Seoul'} />
      </div>
    </div>
  );
}

function NowBarBody({ state, tz }: { state: State; tz: string }) {
  if (state.kind === 'pre') {
    const isToday = state.days === 0;
    return (
      <Shell href="/" tone="amber">
        <Pill className="bg-amber-400 text-amber-950">
          D-{Math.max(state.days, 1)}
        </Pill>
        <Body
          title="여행이 곧 시작돼요"
          subtitle={
            isToday
              ? `첫 일정 · ${state.firstTitle} · ${state.hours}시간 후`
              : `첫 일정 · ${state.firstTitle}`
          }
        />
      </Shell>
    );
  }

  if (state.kind === 'post') {
    return (
      <Shell href="/" tone="neutral">
        <Pill className="bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
          END
        </Pill>
        <Body title="여행 완료" subtitle="즐거운 추억이 남았어요" />
      </Shell>
    );
  }

  if (state.kind === 'current') {
    const e = state.event;
    const next = state.next;
    return (
      <Shell href={`/event/${e.uid}/`} tone="indigo">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
            {e.title}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-[width] duration-700 ease-out"
                style={{ width: `${state.ratio * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-neutral-500 dark:text-neutral-400">
              {fmtDur(state.remainMs)} 남음
            </span>
          </div>
          {next && (
            <p className="mt-1 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                NEXT
              </span>{' '}
              <span className="tabular-nums">
                {formatTimeInTz(next.startDate, tz)}
              </span>{' '}
              · {next.title}
            </p>
          )}
        </div>
      </Shell>
    );
  }

  if (state.kind === 'next') {
    const e = state.event;
    return (
      <Shell href={`/event/${e.uid}/`} tone="emerald">
        <Pill className="bg-emerald-500 text-white">NEXT</Pill>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
            {e.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="tabular-nums">{formatTimeInTz(e.startDate, tz)}</span> · {fmtDur(state.remainMs)} 후
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell href="/" tone="neutral">
      <Pill className="bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
        ·
      </Pill>
      <Body title="일정이 없어요" subtitle="잠시 쉬어가요" />
    </Shell>
  );
}

function Shell({
  href,
  children,
  tone,
}: {
  href: string;
  children: React.ReactNode;
  tone: 'indigo' | 'emerald' | 'amber' | 'neutral';
}) {
  const ring = {
    indigo: 'ring-indigo-200/70 dark:ring-indigo-900/40',
    emerald: 'ring-emerald-200/70 dark:ring-emerald-900/40',
    amber: 'ring-amber-200/70 dark:ring-amber-900/40',
    neutral: 'ring-neutral-200 dark:ring-neutral-800',
  }[tone];
  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg shadow-neutral-900/10 ring-1 backdrop-blur-md transition active:scale-[0.99] dark:bg-neutral-900/95',
        ring,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={[
        'flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function Body({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
        {title}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
        {subtitle}
      </p>
    </div>
  );
}

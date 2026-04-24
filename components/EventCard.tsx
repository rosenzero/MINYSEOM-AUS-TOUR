'use client';

import Link from 'next/link';
import type { EventStatus, ResolvedTripEvent } from '@/lib/types';
import { useDisplayTz } from '@/lib/useDisplayTz';
import { formatTimeInTz, tzAbbr } from '@/lib/timezone';
import { useAllMemos, hasMemo } from '@/lib/memoState';
import { MapPinIcon, StickyNoteIcon } from './Icons';

const statusStyle: Record<
  EventStatus,
  { card: string; time: string; title: string; loc: string; rail: string }
> = {
  past: {
    card: 'opacity-50',
    time: 'text-neutral-400 dark:text-neutral-500',
    title: 'text-neutral-500 dark:text-neutral-400 line-through decoration-1 decoration-neutral-300',
    loc: 'text-neutral-400',
    rail: 'bg-neutral-200 dark:bg-neutral-800',
  },
  current: {
    card: 'bg-indigo-50/80 ring-2 ring-indigo-400 shadow-md shadow-indigo-200/40 dark:bg-indigo-950/40 dark:ring-indigo-500 dark:shadow-indigo-900/20',
    time: 'text-indigo-600 dark:text-indigo-300 font-semibold',
    title: 'text-neutral-900 dark:text-white font-semibold',
    loc: 'text-indigo-700/80 dark:text-indigo-300/80',
    rail: 'bg-indigo-400 dark:bg-indigo-500',
  },
  upcoming: {
    card: 'bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800/70',
    time: 'text-neutral-700 dark:text-neutral-200 font-medium',
    title: 'text-neutral-900 dark:text-white font-medium',
    loc: 'text-neutral-500 dark:text-neutral-400',
    rail: 'bg-neutral-300 dark:bg-neutral-700',
  },
};

export function EventCard({
  event,
  status,
}: {
  event: ResolvedTripEvent;
  status: EventStatus;
}) {
  const s = statusStyle[status];
  const tz = useDisplayTz();
  const startStr = formatTimeInTz(event.startDate, tz);
  const isCrossTz = tz !== event.tz;
  const allMemos = useAllMemos();
  const hasNote = hasMemo(event.uid, allMemos);
  return (
    <Link
      href={`/event/${event.uid}/`}
      className={[
        'group relative flex gap-3 rounded-2xl px-4 py-3 transition active:scale-[0.99]',
        s.card,
      ].join(' ')}
    >
      {/* time rail */}
      <div className="flex w-12 shrink-0 flex-col items-end">
        <span
          className={[
            'text-[15px] leading-snug tabular-nums',
            s.time,
          ].join(' ')}
        >
          {startStr}
        </span>
        {isCrossTz && (
          <span className="mt-0.5 text-[9px] font-medium tracking-wider text-neutral-400 dark:text-neutral-500">
            {tzAbbr(tz)}
          </span>
        )}
      </div>

      {/* divider rail */}
      <div className="relative flex flex-col items-center pt-2">
        {status === 'current' ? (
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse-ring" />
        ) : (
          <span className={['h-2 w-2 rounded-full', s.rail].join(' ')} />
        )}
        <span className={['mt-1 w-px flex-1', s.rail].join(' ')} />
      </div>

      {/* body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={[
              'truncate text-[15px] leading-snug',
              s.title,
            ].join(' ')}
          >
            {event.title}
          </p>
          {hasNote && (
            <StickyNoteIcon
              size={12}
              className="shrink-0 text-amber-500"
              aria-label="메모 있음"
            />
          )}
        </div>
        {event.location && (
          <p className={['mt-1 flex items-center gap-1 truncate text-xs', s.loc].join(' ')}>
            <MapPinIcon size={11} className="shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

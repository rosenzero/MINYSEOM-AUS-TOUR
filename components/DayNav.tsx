'use client';

import { useEffect, useRef } from 'react';
import type { TripDay } from '@/lib/types';

export function DayNav({
  days,
  activeDayIdx,
  onSelect,
}: {
  days: TripDay[];
  activeDayIdx: number;
  onSelect: (idx: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = itemRefs.current[activeDayIdx];
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeDayIdx]);

  return (
    <div className="sticky top-0 z-20 -mt-3 bg-white/80 pt-3 backdrop-blur-md dark:bg-neutral-950/80">
      <div
        ref={containerRef}
        className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3"
      >
        {days.map((d, idx) => {
          const active = idx === activeDayIdx;
          return (
            <button
              key={idx}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              onClick={() => onSelect(idx)}
              className={[
                'flex shrink-0 flex-col items-center rounded-2xl px-4 py-2 transition',
                active
                  ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
              ].join(' ')}
            >
              <span className="text-[10px] font-semibold tracking-wider opacity-70">
                DAY {idx + 1}
              </span>
              <span className="mt-0.5 text-sm font-bold tabular-nums">
                {d.date}
              </span>
              <span className="text-[10px] opacity-70">{d.day}</span>
            </button>
          );
        })}
      </div>
      <div className="h-px w-full bg-neutral-200/70 dark:bg-neutral-800" />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TripHeader } from './TripHeader';
import { DayNav } from './DayNav';
import { EventCard } from './EventCard';
import { NowDivider } from './NowDivider';
import { useNow } from '@/lib/useNow';
import { useDisplayTz } from '@/lib/useDisplayTz';
import { formatDateInTz } from '@/lib/timezone';
import {
  TRIP,
  formatDayLabel,
  getStatus,
  groupEventsByDay,
} from '@/lib/trip';

export function Schedule() {
  const now = useNow();
  const displayTz = useDisplayTz();
  const groups = useMemo(() => groupEventsByDay(), []);
  const dayRefs = useRef<(HTMLElement | null)[]>([]);

  const tripStartYMD = useMemo(() => {
    const [y, m, d] = TRIP.info.startDate.split('-').map(Number);
    return { y, m, d };
  }, []);

  const todayDayIdx = useMemo(() => {
    const cur = formatDateInTz(now, displayTz);
    const startUtc = Date.UTC(tripStartYMD.y, tripStartYMD.m - 1, tripStartYMD.d);
    const curUtc = Date.UTC(cur.y, cur.m - 1, cur.d);
    const diff = Math.floor((curUtc - startUtc) / (24 * 60 * 60 * 1000));
    if (diff < 0) return 0;
    if (diff > TRIP.days.length - 1) return TRIP.days.length - 1;
    return diff;
  }, [now, displayTz, tripStartYMD]);

  const [activeDayIdx, setActiveDayIdx] = useState<number>(todayDayIdx);

  useEffect(() => {
    setActiveDayIdx(todayDayIdx);
  }, [todayDayIdx]);

  // observe day sections to update active chip on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top) {
          const idx = Number((top.target as HTMLElement).dataset.dayIdx);
          if (!Number.isNaN(idx)) setActiveDayIdx(idx);
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    dayRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSelectDay = (idx: number) => {
    setActiveDayIdx(idx);
    dayRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // first time: scroll to current day on mount
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    const target = dayRefs.current[todayDayIdx];
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }
  }, [todayDayIdx]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <TripHeader info={TRIP.info} />
      <DayNav
        days={TRIP.days}
        activeDayIdx={activeDayIdx}
        onSelect={handleSelectDay}
      />

      <div className="px-4 pb-32 pt-4">
        {groups.map(({ dayIdx, day, events }) => {
          // find where to place the NOW divider in this day's list
          const showNowAt = (() => {
            if (events.length === 0) return -1;
            // only show in the day matching today
            if (dayIdx !== todayDayIdx) return -1;
            const t = now.getTime();
            // 1) if a current event exists in this day, divider goes right above it
            const currentIdx = events.findIndex(
              (e) => e.startDate.getTime() <= t && t <= e.endDate.getTime()
            );
            if (currentIdx !== -1) return currentIdx;
            // 2) otherwise, divider goes before the first upcoming event
            const firstUpcoming = events.findIndex(
              (e) => e.startDate.getTime() > t
            );
            // 3) all events past → divider at end
            if (firstUpcoming === -1) return events.length;
            return firstUpcoming;
          })();

          return (
            <section
              key={dayIdx}
              ref={(el) => {
                dayRefs.current[dayIdx] = el;
              }}
              data-day-idx={dayIdx}
              className="scroll-mt-24 pt-6 first:pt-2"
            >
              <div className="mb-2 flex items-baseline gap-2 px-1">
                <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-500">
                  DAY {dayIdx + 1}
                </span>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  {formatDayLabel(day)}
                </h2>
                <span className="ml-auto text-[11px] text-neutral-400">
                  {events.length}개 일정
                </span>
              </div>

              <div className="space-y-2">
                {events.map((e, i) => (
                  <div
                    key={e.uid}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                  >
                    {showNowAt === i && <NowDivider now={now} />}
                    <EventCard event={e} status={getStatus(e, now)} />
                  </div>
                ))}
                {showNowAt === events.length && <NowDivider now={now} />}
              </div>
            </section>
          );
        })}

        <p className="mt-10 text-center text-[11px] text-neutral-400">
          Have a wonderful trip
        </p>
      </div>
    </div>
  );
}

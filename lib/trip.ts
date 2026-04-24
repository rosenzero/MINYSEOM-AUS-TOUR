import tripJson from '@/sample/data.json';
import type {
  EventStatus,
  ResolvedTripEvent,
  TripData,
  TripDay,
  TripEvent,
  TripInfo,
} from './types';
import { getEventTz, zonedTimeToUtc, formatTimeInTz } from './timezone';

export const TRIP: TripData = tripJson as TripData;

function parseHHmm(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { h, m };
}

export function getEventDate(
  info: TripInfo,
  dayIdx: number,
  hhmm: string
): Date {
  const [y, mo, d] = info.startDate.split('-').map(Number);
  const { h, m } = parseHHmm(hhmm);
  return zonedTimeToUtc(y, mo, d + dayIdx, h, m, getEventTz(dayIdx));
}

export function getEventRange(
  info: TripInfo,
  e: TripEvent
): { startDate: Date; endDate: Date } {
  const startDate = getEventDate(info, e.dayIdx, e.start);
  let endDate = getEventDate(info, e.dayIdx, e.end);
  if (endDate.getTime() < startDate.getTime()) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  }
  return { startDate, endDate };
}

const HIDDEN_TITLES = new Set(['취침']);

export function getAllEventsSorted(): ResolvedTripEvent[] {
  const resolved: ResolvedTripEvent[] = TRIP.events
    .map((e, idx) => {
      const { startDate, endDate } = getEventRange(TRIP.info, e);
      return {
        ...e,
        startDate,
        endDate,
        tz: getEventTz(e.dayIdx),
        uid: `d${e.dayIdx}-${e.start}-${idx}`,
      };
    })
    .filter((e) => !HIDDEN_TITLES.has(e.title.trim()));
  resolved.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return resolved;
}

export function getCurrentEvent(now: Date): ResolvedTripEvent | null {
  const t = now.getTime();
  const candidates = getAllEventsSorted().filter(
    (e) => e.startDate.getTime() <= t && t <= e.endDate.getTime()
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, e) =>
    e.startDate.getTime() > latest.startDate.getTime() ? e : latest
  );
}

export function getNextEvent(now: Date): ResolvedTripEvent | null {
  const t = now.getTime();
  const upcoming = getAllEventsSorted().filter(
    (e) => e.startDate.getTime() > t
  );
  return upcoming[0] ?? null;
}

export function getStatus(e: ResolvedTripEvent, now: Date): EventStatus {
  const t = now.getTime();
  if (t < e.startDate.getTime()) return 'upcoming';
  if (t > e.endDate.getTime()) return 'past';
  return 'current';
}

export function formatTimeRange(e: TripEvent): string {
  return `${e.start} – ${e.end}`;
}

export function formatEventTime(e: ResolvedTripEvent, tz: string): {
  start: string;
  end: string;
} {
  return {
    start: formatTimeInTz(e.startDate, tz),
    end: formatTimeInTz(e.endDate, tz),
  };
}

export function formatDayLabel(d: TripDay): string {
  return `${d.date} (${d.day})`;
}

export function groupEventsByDay(): {
  dayIdx: number;
  day: TripDay;
  events: ResolvedTripEvent[];
}[] {
  const all = getAllEventsSorted();
  return TRIP.days.map((day, dayIdx) => ({
    dayIdx,
    day,
    events: all.filter((e) => e.dayIdx === dayIdx),
  }));
}

export function getAuStartUtcMs(): number {
  const all = getAllEventsSorted();
  const firstAu = all.find((e) => e.dayIdx >= 1);
  return (firstAu ?? all[0]).startDate.getTime();
}

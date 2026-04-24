import { TZ_AU, TZ_KR, zonedTimeToUtc } from './timezone';

export interface Flight {
  id: string;
  label: string;
  from: { code: string; name: string; city: string; tz: string };
  to: { code: string; name: string; city: string; tz: string };
  dep: { date: string; time: string };
  arr: { date: string; time: string };
  terminal?: string;
  gate?: string;
  carrier?: string;
  flightNo?: string;
  checkinOpenHoursBefore?: number;
  checkinCloseMinutesBefore?: number;
  baggageUrl?: string;
  bookingRef?: string;
  notes?: string;
}

export interface ResolvedFlight extends Flight {
  depDate: Date;
  arrDate: Date;
  checkinOpenDate: Date | null;
  checkinCloseDate: Date | null;
}

export const FLIGHTS: Flight[] = [
  {
    id: 'icn-bne',
    label: '인천 → 브리즈번',
    from: {
      code: 'ICN',
      name: 'Incheon International Airport',
      city: '인천',
      tz: TZ_KR,
    },
    to: {
      code: 'BNE',
      name: 'Brisbane International Airport',
      city: '브리즈번',
      tz: TZ_AU,
    },
    dep: { date: '2026-05-01', time: '20:00' },
    arr: { date: '2026-05-02', time: '07:00' },
    terminal: 'T2',
    gate: '252',
    carrier: '',
    flightNo: '',
    checkinOpenHoursBefore: 3,
    checkinCloseMinutesBefore: 60,
    baggageUrl:
      'https://www.airport.kr/ap_ko/7024/subview.do?enc=Zm5jdDF8QEB8JTJGYnJkJTJGdmlldy5kbyUzRmJic19jZCUzRDEwMTAlMjZiYnNJZCUzRGJiczNfMDElMjZibnR0X2lkJTNE',
  },
  {
    id: 'bne-cns',
    label: '브리즈번 → 케언즈',
    from: {
      code: 'BNE',
      name: 'Brisbane Airport Domestic',
      city: '브리즈번',
      tz: TZ_AU,
    },
    to: {
      code: 'CNS',
      name: 'Cairns Airport',
      city: '케언즈',
      tz: TZ_AU,
    },
    dep: { date: '2026-05-02', time: '09:30' },
    arr: { date: '2026-05-02', time: '13:00' },
    carrier: '',
    flightNo: '',
    checkinOpenHoursBefore: 2,
    checkinCloseMinutesBefore: 30,
  },
  {
    id: 'bne-icn',
    label: '브리즈번 → 인천',
    from: {
      code: 'BNE',
      name: 'Brisbane International Airport',
      city: '브리즈번',
      tz: TZ_AU,
    },
    to: {
      code: 'ICN',
      name: 'Incheon International Airport',
      city: '인천',
      tz: TZ_KR,
    },
    dep: { date: '2026-05-07', time: '13:30' },
    arr: { date: '2026-05-07', time: '21:30' },
    checkinOpenHoursBefore: 3,
    checkinCloseMinutesBefore: 60,
  },
];

function parseYmd(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number);
  return [y, m, d];
}

function parseHm(s: string): [number, number] {
  const [h, mi] = s.split(':').map(Number);
  return [h, mi];
}

export function resolveFlight(f: Flight): ResolvedFlight {
  const [dy, dm, dd] = parseYmd(f.dep.date);
  const [dh, dmi] = parseHm(f.dep.time);
  const depDate = zonedTimeToUtc(dy, dm, dd, dh, dmi, f.from.tz);

  const [ay, am, ad] = parseYmd(f.arr.date);
  const [ah, ami] = parseHm(f.arr.time);
  const arrDate = zonedTimeToUtc(ay, am, ad, ah, ami, f.to.tz);

  const checkinOpenDate =
    typeof f.checkinOpenHoursBefore === 'number'
      ? new Date(depDate.getTime() - f.checkinOpenHoursBefore * 3_600_000)
      : null;
  const checkinCloseDate =
    typeof f.checkinCloseMinutesBefore === 'number'
      ? new Date(depDate.getTime() - f.checkinCloseMinutesBefore * 60_000)
      : null;

  return { ...f, depDate, arrDate, checkinOpenDate, checkinCloseDate };
}

export function resolveAllFlights(): ResolvedFlight[] {
  const sorted = FLIGHTS.map(resolveFlight);
  sorted.sort((a, b) => a.depDate.getTime() - b.depDate.getTime());
  return sorted;
}

export function getNextFlight(now: Date): ResolvedFlight | null {
  const t = now.getTime();
  const all = resolveAllFlights();
  const upcoming = all.find((f) => f.depDate.getTime() > t);
  if (upcoming) return upcoming;
  const active = all.find(
    (f) => t >= f.depDate.getTime() && t <= f.arrDate.getTime()
  );
  return active ?? null;
}

export type FlightPhase =
  | 'pre-checkin'
  | 'checkin-open'
  | 'checkin-closing'
  | 'boarding'
  | 'in-flight'
  | 'landed';

export function flightPhase(f: ResolvedFlight, now: Date): FlightPhase {
  const t = now.getTime();
  if (t > f.arrDate.getTime()) return 'landed';
  if (t >= f.depDate.getTime()) return 'in-flight';
  const boardingStart = f.depDate.getTime() - 30 * 60_000;
  if (t >= boardingStart) return 'boarding';
  if (f.checkinCloseDate && t >= f.checkinCloseDate.getTime())
    return 'checkin-closing';
  if (f.checkinOpenDate && t >= f.checkinOpenDate.getTime())
    return 'checkin-open';
  return 'pre-checkin';
}

export const TZ_KR = 'Asia/Seoul';
export const TZ_AU = 'Australia/Brisbane';

export type DisplayTzMode = 'auto' | 'kr' | 'au';

export function getEventTz(dayIdx: number): string {
  return dayIdx === 0 ? TZ_KR : TZ_AU;
}

function getTzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const m: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') m[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(m.year),
    Number(m.month) - 1,
    Number(m.day),
    Number(m.hour) === 24 ? 0 : Number(m.hour),
    Number(m.minute),
    Number(m.second)
  );
  return asUtc - utcMs;
}

export function zonedTimeToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  tz: string
): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = getTzOffsetMs(guess, tz);
  const utc1 = guess - offset;
  const offset2 = getTzOffsetMs(utc1, tz);
  return new Date(guess - offset2);
}

export function formatTimeInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: tz,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateInTz(
  date: Date,
  tz: string
): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') m[p.type] = p.value;
  return {
    y: Number(m.year),
    m: Number(m.month),
    d: Number(m.day),
  };
}

export function tzAbbr(tz: string): string {
  if (tz === TZ_KR) return 'KST';
  if (tz === TZ_AU) return 'AEST';
  return tz;
}

export function tzShortLabel(tz: string): string {
  if (tz === TZ_KR) return '한국';
  if (tz === TZ_AU) return '호주';
  return tz;
}

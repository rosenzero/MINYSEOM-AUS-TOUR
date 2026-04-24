'use client';

import { formatTimeInTz } from '@/lib/timezone';
import { useDisplayTz } from '@/lib/useDisplayTz';

export function NowDivider({ now }: { now: Date }) {
  const tz = useDisplayTz();
  const hm = formatTimeInTz(now, tz);
  return (
    <div className="my-1 flex items-center gap-2 px-1" aria-label="현재 시각">
      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
        NOW {hm}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-rose-400 via-rose-300/50 to-transparent" />
    </div>
  );
}

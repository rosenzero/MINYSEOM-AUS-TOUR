import type { TripInfo } from '@/lib/types';
import { ShareButton } from './ShareButton';
import { HeaderMesh } from './HeaderMesh';
import { FeatureMenu } from './FeatureMenu';

function fmtDateRange(start: string, end: string) {
  const [, sm, sd] = start.split('-');
  const [, em, ed] = end.split('-');
  return `${Number(sm)}/${Number(sd)} – ${Number(em)}/${Number(ed)}`;
}

export function TripHeader({ info }: { info: TripInfo }) {
  return (
    <header className="relative overflow-hidden bg-indigo-700 text-white">
      <HeaderMesh tone="indigo" />
      <div className="relative px-5 pt-6 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.2em] text-white/80">
              AUSTRALIA · {fmtDateRange(info.startDate, info.endDate)}
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight">
              {info.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ShareButton
              variant="icon-light"
              shareTitle={info.title}
              shareText={`${fmtDateRange(info.startDate, info.endDate)} 여행 일정 보기`}
            />
            <FeatureMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

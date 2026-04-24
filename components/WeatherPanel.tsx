'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  WEATHER_CITIES,
  fetchForecast,
  sourceLabel,
  useWeatherCache,
  writeCachedForecast,
  type CityForecast,
  type DailyForecast,
  type WeatherCity,
  type WeatherKind,
} from '@/lib/weatherState';
import {
  CloseIcon,
  CloudDrizzleIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  DropletIcon,
  RefreshIcon,
  SunIcon,
  ThermometerIcon,
  WarnIcon,
} from './Icons';
import type { ComponentType } from 'react';
import type { IconProps } from './Icons';

const STALE_MS = 60 * 60 * 1000;

function weekdayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function fmtAgo(ts: number | null): string {
  if (!ts) return '갱신 안됨';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

const kindMap: Record<
  WeatherKind,
  { Icon: ComponentType<IconProps>; tone: string }
> = {
  clear: { Icon: SunIcon, tone: 'text-amber-500' },
  partly: { Icon: CloudSunIcon, tone: 'text-amber-400' },
  cloud: { Icon: CloudIcon, tone: 'text-neutral-400' },
  fog: { Icon: CloudFogIcon, tone: 'text-neutral-400' },
  drizzle: { Icon: CloudDrizzleIcon, tone: 'text-sky-400' },
  rain: { Icon: CloudRainIcon, tone: 'text-sky-500' },
  snow: { Icon: CloudSnowIcon, tone: 'text-sky-300' },
  thunder: { Icon: CloudLightningIcon, tone: 'text-violet-500' },
  wind: { Icon: CloudIcon, tone: 'text-neutral-400' },
};

export function WeatherPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const cache = useWeatherCache();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async (silent = false) => {
    if (!silent) setError(null);
    setLoading(() => {
      const next: Record<string, boolean> = {};
      for (const c of WEATHER_CITIES) next[c.id] = true;
      return next;
    });
    const results = await Promise.allSettled(
      WEATHER_CITIES.map((c) => fetchForecast(c))
    );
    let anyOk = false;
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        writeCachedForecast(r.value);
        anyOk = true;
      }
    });
    if (!anyOk) setError('날씨 정보를 못 가져왔어요');
    setLoading({});
  }, []);

  useEffect(() => {
    if (!open) return;
    const stale = WEATHER_CITIES.some((c) => {
      const f = cache[c.id];
      return !f || Date.now() - f.fetchedAt > STALE_MS;
    });
    if (stale && typeof navigator !== 'undefined' && navigator.onLine) {
      refreshAll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const lastFetchedAt = Object.values(cache).reduce<number | null>(
    (acc, f) => {
      if (!f) return acc;
      if (acc === null) return f.fetchedAt;
      return Math.max(acc, f.fetchedAt);
    },
    null
  );
  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="날씨"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl animate-slide-up dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />

        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold text-neutral-900 dark:text-white">
            <SunIcon size={18} />
            날씨
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {WEATHER_CITIES.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              forecast={cache[city.id]}
              loading={!!loading[city.id]}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
          <p className="text-[10px] text-neutral-500">
            {fmtAgo(lastFetchedAt)} 갱신 · 호주 BOM + Open-Meteo
          </p>
          <button
            type="button"
            onClick={() => refreshAll(false)}
            disabled={anyLoading}
            className="flex items-center gap-1 rounded-md bg-sky-500 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            {anyLoading ? (
              '조회 중…'
            ) : (
              <>
                <RefreshIcon size={12} />
                새로고침
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-rose-500">
            <WarnIcon size={12} />
            {error} · 캐시된 값으로 표시 중
          </p>
        )}
        <p className="mt-2 text-center text-[10px] text-neutral-400">
          * 호주 도시는 BOM 공식 API, 인천은 Open-Meteo · 오프라인 시 마지막 캐시 사용
        </p>
      </div>
    </div>
  );
}

function CityCard({
  city,
  forecast,
  loading,
}: {
  city: WeatherCity;
  forecast: CityForecast | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-bold text-neutral-900 dark:text-white">
            {city.name}
          </p>
          {forecast && (
            <span
              className={[
                'rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider',
                forecast.source === 'bom'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
              ].join(' ')}
              title={
                forecast.source === 'bom'
                  ? 'Bureau of Meteorology (호주 기상청)'
                  : 'Open-Meteo'
              }
            >
              {sourceLabel(forecast.source)}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium tracking-wider text-neutral-400">
          3일 예보
        </span>
      </div>
      {forecast ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {forecast.days.slice(0, 3).map((day) => (
            <DayTile key={day.date} day={day} />
          ))}
        </div>
      ) : (
        <p className="mt-3 py-4 text-center text-[12px] text-neutral-400">
          {loading ? '불러오는 중…' : '데이터 없음 — 새로고침 눌러주세요'}
        </p>
      )}
    </div>
  );
}

function DayTile({ day }: { day: DailyForecast }) {
  const { Icon, tone } = kindMap[day.kind];
  return (
    <div className="rounded-2xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/60">
      <p className="text-[10px] font-semibold tracking-wider text-neutral-500">
        {weekdayOf(day.date)} · {shortDate(day.date)}
      </p>
      <div className="my-2 flex justify-center">
        <Icon size={28} className={tone} />
      </div>
      <p className="truncate text-[10px] text-neutral-500" title={day.label}>
        {day.label}
      </p>
      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
        <ThermometerIcon size={11} className="text-rose-400" />
        {Math.round(day.tMax)}°
        <span className="text-neutral-400">/</span>
        {Math.round(day.tMin)}°
      </div>
      {day.precipProb !== null && day.precipProb > 0 && (
        <p className="mt-1 flex items-center justify-center gap-0.5 text-[10px] tabular-nums text-sky-500">
          <DropletIcon size={10} />
          {day.precipProb}%
        </p>
      )}
    </div>
  );
}

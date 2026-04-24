'use client';

import { useEffect, useState } from 'react';

export type WeatherSource = 'bom' | 'open-meteo';

export interface WeatherCity {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tz: string;
  /** BOM geohash (6-char) for Australian cities */
  bomGeohash?: string;
}

export const WEATHER_CITIES: WeatherCity[] = [
  { id: 'icn', name: '인천', lat: 37.4602, lon: 126.4407, tz: 'Asia/Seoul' },
  {
    id: 'cns',
    name: '케언즈',
    lat: -16.9203,
    lon: 145.7781,
    tz: 'Australia/Brisbane',
    bomGeohash: 'ruzx6d',
  },
  {
    id: 'bne',
    name: '브리즈번',
    lat: -27.4698,
    lon: 153.0251,
    tz: 'Australia/Brisbane',
    bomGeohash: 'r7hgmm',
  },
];

export type WeatherKind =
  | 'clear'
  | 'partly'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'wind';

export interface DailyForecast {
  date: string;
  label: string;
  kind: WeatherKind;
  tMax: number;
  tMin: number;
  precipProb: number | null;
}

export interface CityForecast {
  cityId: string;
  source: WeatherSource;
  fetchedAt: number;
  days: DailyForecast[];
}

const KEY_PREFIX = 'aus-tour:weather:';
const EVT = 'aus-tour:weather:change';

function cacheKey(cityId: string) {
  return `${KEY_PREFIX}${cityId}`;
}

export function readCachedForecast(cityId: string): CityForecast | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(cityId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CityForecast;
    if (
      parsed &&
      typeof parsed.fetchedAt === 'number' &&
      Array.isArray(parsed.days)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCachedForecast(f: CityForecast) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(cacheKey(f.cityId), JSON.stringify(f));
  window.dispatchEvent(new Event(EVT));
}

export function onWeatherChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}

/* ---------------- BOM (Bureau of Meteorology) ---------------- */

interface BomDailyItem {
  date?: string;
  temp_max?: number | null;
  temp_min?: number | null;
  short_text?: string | null;
  extended_text?: string | null;
  icon_descriptor?: string | null;
  rain?: {
    amount?: { min?: number | null; max?: number | null; units?: string };
    chance?: number | null;
  };
}

function bomIconToKind(desc: string | null | undefined): WeatherKind {
  switch (desc) {
    case 'sunny':
      return 'clear';
    case 'mostly_sunny':
    case 'partly_cloudy':
      return 'partly';
    case 'cloudy':
    case 'overcast':
      return 'cloud';
    case 'hazy':
    case 'fog':
    case 'dusty':
    case 'smoke':
      return 'fog';
    case 'light_rain':
    case 'light_shower':
      return 'drizzle';
    case 'rain':
    case 'shower':
    case 'heavy_shower':
    case 'heavy_rain':
    case 'cyclone':
      return 'rain';
    case 'snow':
    case 'frost':
      return 'snow';
    case 'storm':
      return 'thunder';
    case 'wind':
      return 'wind';
    default:
      return 'cloud';
  }
}

const BOM_LABEL_OVERRIDE: Record<string, string> = {
  sunny: '맑음',
  mostly_sunny: '대체로 맑음',
  partly_cloudy: '구름 조금',
  cloudy: '흐림',
  overcast: '짙게 흐림',
  hazy: '연무',
  fog: '안개',
  dusty: '먼지',
  smoke: '연기',
  light_rain: '약한 비',
  light_shower: '약한 소나기',
  rain: '비',
  shower: '소나기',
  heavy_shower: '강한 소나기',
  heavy_rain: '폭우',
  cyclone: '사이클론',
  snow: '눈',
  frost: '서리',
  storm: '뇌우',
  wind: '강풍',
};

async function fetchBom(
  city: WeatherCity,
  signal?: AbortSignal
): Promise<CityForecast> {
  if (!city.bomGeohash) throw new Error('no bom geohash');
  const url = `https://api.weather.bom.gov.au/v1/locations/${city.bomGeohash}/forecasts/daily`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`bom http ${res.status}`);
  const json = (await res.json()) as { data?: BomDailyItem[] };
  const items = json.data ?? [];
  if (items.length === 0) throw new Error('bom empty');
  const days: DailyForecast[] = items.slice(0, 3).map((it) => {
    const dateIso = it.date ?? '';
    const date = dateIso.slice(0, 10);
    const descKey = it.icon_descriptor ?? '';
    return {
      date,
      label: BOM_LABEL_OVERRIDE[descKey] ?? it.short_text ?? '정보 없음',
      kind: bomIconToKind(descKey),
      tMax: typeof it.temp_max === 'number' ? it.temp_max : NaN,
      tMin: typeof it.temp_min === 'number' ? it.temp_min : NaN,
      precipProb:
        typeof it.rain?.chance === 'number' ? it.rain.chance : null,
    };
  });
  return { cityId: city.id, source: 'bom', fetchedAt: Date.now(), days };
}

/* ---------------- Open-Meteo (fallback for non-AU) ---------------- */

function openMeteoCodeToKind(code: number): { kind: WeatherKind; label: string } {
  if (code === 0) return { kind: 'clear', label: '맑음' };
  if (code === 1) return { kind: 'partly', label: '대체로 맑음' };
  if (code === 2) return { kind: 'partly', label: '구름 조금' };
  if (code === 3) return { kind: 'cloud', label: '흐림' };
  if (code === 45 || code === 48) return { kind: 'fog', label: '안개' };
  if (code >= 51 && code <= 57) return { kind: 'drizzle', label: '이슬비' };
  if (code >= 61 && code <= 67) return { kind: 'rain', label: '비' };
  if (code >= 71 && code <= 77) return { kind: 'snow', label: '눈' };
  if (code >= 80 && code <= 82) return { kind: 'rain', label: '소나기' };
  if (code >= 85 && code <= 86) return { kind: 'snow', label: '눈 소나기' };
  if (code >= 95 && code <= 99) return { kind: 'thunder', label: '뇌우' };
  return { kind: 'cloud', label: '정보 없음' };
}

async function fetchOpenMeteo(
  city: WeatherCity,
  signal?: AbortSignal
): Promise<CityForecast> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(city.lat));
  url.searchParams.set('longitude', String(city.lon));
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max'
  );
  url.searchParams.set('timezone', city.tz);
  url.searchParams.set('forecast_days', '3');
  const res = await fetch(url.toString(), { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`open-meteo http ${res.status}`);
  const data = (await res.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      weather_code?: number[];
      precipitation_probability_max?: (number | null)[];
    };
  };
  const d = data.daily;
  if (!d || !d.time) throw new Error('open-meteo bad payload');
  const days: DailyForecast[] = d.time.map((date, i) => {
    const { kind, label } = openMeteoCodeToKind(d.weather_code?.[i] ?? 0);
    return {
      date,
      label,
      kind,
      tMax: d.temperature_2m_max?.[i] ?? NaN,
      tMin: d.temperature_2m_min?.[i] ?? NaN,
      precipProb: d.precipitation_probability_max?.[i] ?? null,
    };
  });
  return { cityId: city.id, source: 'open-meteo', fetchedAt: Date.now(), days };
}

/* ---------------- Dispatcher: BOM first, Open-Meteo fallback ---------------- */

export async function fetchForecast(
  city: WeatherCity,
  signal?: AbortSignal
): Promise<CityForecast> {
  if (city.bomGeohash) {
    try {
      return await fetchBom(city, signal);
    } catch {
      // fall through to open-meteo
    }
  }
  return fetchOpenMeteo(city, signal);
}

export function useWeatherCache(): Record<string, CityForecast | null> {
  const [cache, setCache] = useState<Record<string, CityForecast | null>>({});
  useEffect(() => {
    const read = () => {
      const next: Record<string, CityForecast | null> = {};
      for (const c of WEATHER_CITIES) next[c.id] = readCachedForecast(c.id);
      setCache(next);
    };
    read();
    return onWeatherChange(read);
  }, []);
  return cache;
}

export function sourceLabel(s: WeatherSource): string {
  return s === 'bom' ? 'BOM' : 'Open-Meteo';
}

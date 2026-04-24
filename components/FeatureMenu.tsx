'use client';

import Link from 'next/link';
import { useEffect, useState, type ComponentType } from 'react';
import { CurrencyConverter } from './CurrencyConverter';
import { FlightPanel } from './FlightPanel';
import { WeatherPanel } from './WeatherPanel';
import { TimezoneToggle } from './TimezoneToggle';
import {
  BriefcaseIcon,
  ExchangeIcon,
  GlobeIcon,
  MoreIcon,
  PlaneIcon,
  SunIcon,
} from './Icons';

type SubSheet = 'fx' | 'flight' | 'weather' | null;
type IconCmp = ComponentType<{ size?: number; className?: string }>;

export function FeatureMenu({
  variant = 'icon-light',
}: {
  variant?: 'icon-light' | 'icon-dark';
} = {}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sub, setSub] = useState<SubSheet>(null);

  const triggerTone =
    variant === 'icon-light'
      ? 'bg-white/20 text-white hover:bg-white/30'
      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700';

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const openSub = (s: SubSheet) => {
    setSub(s);
    setMenuOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="도구 메뉴"
        onClick={() => setMenuOpen(true)}
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95',
          triggerTone,
        ].join(' ')}
      >
        <MoreIcon size={18} />
      </button>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="도구 메뉴"
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl animate-slide-up dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                도구
              </h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Tile
                Icon={PlaneIcon}
                label="항공편"
                onClick={() => openSub('flight')}
              />
              <Tile
                Icon={ExchangeIcon}
                label="환율"
                onClick={() => openSub('fx')}
              />
              <TileLink
                Icon={BriefcaseIcon}
                label="짐 챙기기"
                href="/packing/"
                onClick={() => setMenuOpen(false)}
              />
              <Tile
                Icon={SunIcon}
                label="날씨"
                onClick={() => openSub('weather')}
              />
            </div>

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/60">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-neutral-500">
                    <GlobeIcon size={12} />
                    표시 시간대
                  </p>
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    자동은 호주 도착 시점에 전환돼요
                  </p>
                </div>
                <div className="shrink-0">
                  <TimezoneToggle />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <CurrencyConverter open={sub === 'fx'} onClose={() => setSub(null)} />
      <FlightPanel open={sub === 'flight'} onClose={() => setSub(null)} />
      <WeatherPanel open={sub === 'weather'} onClose={() => setSub(null)} />
    </>
  );
}

function Tile({
  Icon,
  label,
  onClick,
}: {
  Icon: IconCmp;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-neutral-50 px-2 py-4 text-center text-neutral-700 transition active:scale-[0.97] hover:bg-neutral-100 dark:bg-neutral-800/60 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <Icon size={22} />
      <span className="text-[12px] font-medium">{label}</span>
    </button>
  );
}

function TileLink({
  Icon,
  label,
  href,
  onClick,
}: {
  Icon: IconCmp;
  label: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-neutral-50 px-2 py-4 text-center text-neutral-700 transition active:scale-[0.97] hover:bg-neutral-100 dark:bg-neutral-800/60 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <Icon size={22} />
      <span className="text-[12px] font-medium">{label}</span>
    </Link>
  );
}


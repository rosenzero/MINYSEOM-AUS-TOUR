'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  flightPhase,
  getNextFlight,
  resolveAllFlights,
  type FlightPhase,
  type ResolvedFlight,
} from '@/lib/flights';
import { formatTimeInTz, tzAbbr } from '@/lib/timezone';
import { useDisplayTz } from '@/lib/useDisplayTz';
import { useNow } from '@/lib/useNow';
import {
  ClockIcon,
  CloseIcon,
  ExternalLinkIcon,
  GateIcon,
  LuggageIcon,
  PlaneIcon,
  PlaneLandingIcon,
  PlaneTakeoffIcon,
  TicketIcon,
  TimerIcon,
} from './Icons';

function fmtCountdown(ms: number): string {
  const abs = Math.abs(ms);
  const totalMin = Math.floor(abs / 60_000);
  const d = Math.floor(totalMin / (60 * 24));
  const h = Math.floor((totalMin % (60 * 24)) / 60);
  const m = totalMin % 60;
  if (d >= 1) return `${d}일 ${h}시간`;
  if (h >= 1) return `${h}시간 ${m}분`;
  return `${m}분`;
}

const phaseLabel: Record<FlightPhase, { text: string; cls: string }> = {
  'pre-checkin': {
    text: '출발 전',
    cls: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  },
  'checkin-open': {
    text: '체크인 가능',
    cls: 'bg-emerald-500 text-white',
  },
  'checkin-closing': {
    text: '체크인 마감 임박',
    cls: 'bg-amber-500 text-amber-950',
  },
  boarding: {
    text: '탑승 중',
    cls: 'bg-indigo-500 text-white',
  },
  'in-flight': {
    text: '비행 중',
    cls: 'bg-sky-500 text-white',
  },
  landed: {
    text: '착륙 완료',
    cls: 'bg-neutral-300 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  },
};

export function FlightPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const now = useNow();
  const displayTz = useDisplayTz();
  const allFlights = useMemo(() => resolveAllFlights(), []);
  const upcoming = useMemo(() => getNextFlight(now), [now]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!selectedId && upcoming) setSelectedId(upcoming.id);
  }, [open, upcoming, selectedId]);

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

  const selected =
    allFlights.find((f) => f.id === selectedId) ?? upcoming ?? allFlights[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="항공편 정보"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl animate-slide-up dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />

        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold text-neutral-900 dark:text-white">
            <PlaneIcon size={18} />
            항공편
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

        {/* flight selector */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto no-scrollbar">
          {allFlights.map((f) => {
            const active = f.id === selected?.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedId(f.id)}
                className={[
                  'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
                  active
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
                ].join(' ')}
              >
                {f.from.code} → {f.to.code}
              </button>
            );
          })}
        </div>

        {selected && (
          <FlightCard flight={selected} now={now} displayTz={displayTz} />
        )}

        <p className="mt-4 text-center text-[10px] text-neutral-400">
          * 카운트다운은 {tzAbbr(displayTz)} 기준 · 정확한 게이트는 공항 안내판 확인
        </p>
      </div>
    </div>
  );
}

function FlightCard({
  flight,
  now,
  displayTz,
}: {
  flight: ResolvedFlight;
  now: Date;
  displayTz: string;
}) {
  const phase = flightPhase(flight, now);
  const depDisp = formatTimeInTz(flight.depDate, displayTz);
  const arrDisp = formatTimeInTz(flight.arrDate, displayTz);
  const depLocal = formatTimeInTz(flight.depDate, flight.from.tz);
  const arrLocal = formatTimeInTz(flight.arrDate, flight.to.tz);
  const showLocal = displayTz !== flight.from.tz || displayTz !== flight.to.tz;

  const target = (() => {
    if (phase === 'landed') return { label: '도착 완료', ms: 0 };
    if (phase === 'in-flight' || phase === 'boarding') {
      return {
        label: '착륙까지',
        ms: flight.arrDate.getTime() - now.getTime(),
      };
    }
    return {
      label: '출발까지',
      ms: flight.depDate.getTime() - now.getTime(),
    };
  })();

  const durationMin = Math.round(
    (flight.arrDate.getTime() - flight.depDate.getTime()) / 60_000
  );
  const durH = Math.floor(durationMin / 60);
  const durM = durationMin % 60;

  const pl = phaseLabel[phase];

  return (
    <div className="mt-4 space-y-4">
      {/* countdown + phase */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center justify-between">
          <span
            className={[
              'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider',
              pl.cls,
            ].join(' ')}
          >
            {pl.text}
          </span>
          <span className="text-[11px] font-medium tracking-wider text-white/80">
            {flight.label}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <TimerIcon size={20} className="text-white/80" />
          <span className="text-[11px] font-semibold tracking-wider text-white/80">
            {target.label}
          </span>
        </div>
        <p className="mt-1 font-mono text-4xl font-bold tabular-nums">
          {phase === 'landed' ? '—' : fmtCountdown(target.ms)}
        </p>
      </div>

      {/* route card */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
        <div className="flex items-center justify-between gap-3">
          <RoutePoint
            code={flight.from.code}
            city={flight.from.city}
            time={depDisp}
            localTime={showLocal && displayTz !== flight.from.tz ? depLocal : null}
            localTz={flight.from.tz}
          />
          <div className="flex flex-col items-center gap-1 text-neutral-400">
            <div className="flex items-center gap-1">
              <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700" />
              <PlaneIcon size={14} />
              <span className="h-px w-6 bg-neutral-300 dark:bg-neutral-700" />
            </div>
            <span className="text-[10px] font-medium">
              {durH}시간 {durM}분
            </span>
          </div>
          <RoutePoint
            code={flight.to.code}
            city={flight.to.city}
            time={arrDisp}
            localTime={showLocal && displayTz !== flight.to.tz ? arrLocal : null}
            localTz={flight.to.tz}
            align="right"
          />
        </div>

        {(flight.carrier || flight.flightNo) && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
            <TicketIcon size={12} />
            {[flight.carrier, flight.flightNo].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      {/* airport info */}
      <div className="grid grid-cols-2 gap-2">
        <InfoTile
          icon={<GateIcon size={14} />}
          label="터미널 / 게이트"
          value={
            flight.terminal || flight.gate
              ? [flight.terminal, flight.gate && `Gate ${flight.gate}`]
                  .filter(Boolean)
                  .join(' · ')
              : '공항 안내판 확인'
          }
        />
        <InfoTile
          icon={<ClockIcon size={14} />}
          label="체크인 시작"
          value={
            flight.checkinOpenDate
              ? formatTimeInTz(flight.checkinOpenDate, displayTz)
              : '-'
          }
          sub={
            flight.checkinCloseDate
              ? `마감 ${formatTimeInTz(flight.checkinCloseDate, displayTz)}`
              : undefined
          }
        />
      </div>

      {/* external links */}
      <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
        <p className="text-[11px] font-semibold tracking-wider text-neutral-500">
          참고 링크
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          <ExtLink
            href={`https://www.google.com/search?q=${encodeURIComponent(
              `${flight.from.code} ${flight.to.code} flight status`
            )}`}
            icon={<PlaneIcon size={13} />}
            label="운항 정보 검색"
          />
          {flight.baggageUrl && (
            <ExtLink
              href={flight.baggageUrl}
              icon={<LuggageIcon size={13} />}
              label="수하물 규정"
            />
          )}
          {flight.from.code === 'ICN' && (
            <ExtLink
              href="https://www.airport.kr/ap_ko/index.do"
              icon={<PlaneTakeoffIcon size={13} />}
              label="인천공항 안내"
            />
          )}
          {flight.to.code === 'BNE' && (
            <ExtLink
              href="https://www.bne.com.au/"
              icon={<PlaneLandingIcon size={13} />}
              label="브리즈번 공항 안내"
            />
          )}
          {flight.to.code === 'CNS' && (
            <ExtLink
              href="https://www.cairnsairport.com.au/"
              icon={<PlaneLandingIcon size={13} />}
              label="케언즈 공항 안내"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RoutePoint({
  code,
  city,
  time,
  localTime,
  localTz,
  align = 'left',
}: {
  code: string;
  city: string;
  time: string;
  localTime: string | null;
  localTz: string;
  align?: 'left' | 'right';
}) {
  return (
    <div
      className={[
        'min-w-0 flex-1',
        align === 'right' ? 'text-right' : 'text-left',
      ].join(' ')}
    >
      <p className="font-mono text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">
        {code}
      </p>
      <p className="text-[11px] text-neutral-500">{city}</p>
      <p className="mt-1 font-mono text-base font-semibold tabular-nums text-indigo-600 dark:text-indigo-300">
        {time}
      </p>
      {localTime && (
        <p className="text-[10px] tabular-nums text-neutral-400">
          {tzAbbr(localTz)} {localTime}
        </p>
      )}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
      <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-neutral-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-900 dark:text-white">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-neutral-400">{sub}</p>}
    </div>
  );
}

function ExtLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <ExternalLinkIcon size={12} className="text-neutral-400" />
    </a>
  );
}

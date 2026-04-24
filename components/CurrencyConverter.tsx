'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_AUD_KRW,
  fetchLiveAudKrw,
  resetFxRate,
  setFxRate,
  useFx,
} from '@/lib/fxState';
import { ExchangeIcon, RefreshIcon, WarnIcon } from './Icons';

type Direction = 'aud2krw' | 'krw2aud';

function fmtKRW(n: number): string {
  if (!Number.isFinite(n)) return '-';
  return Math.round(n).toLocaleString('ko-KR');
}

function fmtAUD(n: number): string {
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtAgo(ts: number | null): string {
  if (!ts) return '갱신 안됨';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const d = Math.floor(hr / 24);
  return `${d}일 전`;
}

const LIVE_STALE_MS = 30 * 60 * 1000;

export function CurrencyConverter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fx = useFx();
  const [direction, setDirection] = useState<Direction>('aud2krw');
  const [amount, setAmount] = useState<string>('10');
  const [editingRate, setEditingRate] = useState(false);
  const [rateDraft, setRateDraft] = useState<string>('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshLive = useCallback(async (silent = false) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setFetchError(null);
    setFetching(true);
    try {
      const { rate } = await fetchLiveAudKrw(ctrl.signal);
      setFxRate(rate, 'live');
      setFetchError(null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setFetchError('실시간 환율을 못 가져왔어요');
    } finally {
      if (!ctrl.signal.aborted) setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const stale =
      fx.source !== 'live' ||
      !fx.updatedAt ||
      Date.now() - fx.updatedAt > LIVE_STALE_MS;
    if (stale && typeof navigator !== 'undefined' && navigator.onLine) {
      refreshLive(true);
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

  const amountNum = Number(amount.replace(/,/g, ''));
  const computed = useMemo(() => {
    if (!Number.isFinite(amountNum)) return { aud: 0, krw: 0 };
    if (direction === 'aud2krw') {
      return { aud: amountNum, krw: amountNum * fx.rate };
    }
    return { krw: amountNum, aud: amountNum / fx.rate };
  }, [amountNum, direction, fx.rate]);

  const swap = () => {
    setDirection((d) => (d === 'aud2krw' ? 'krw2aud' : 'aud2krw'));
    setAmount((prev) => {
      const n = Number(prev.replace(/,/g, ''));
      if (!Number.isFinite(n)) return prev;
      const next =
        direction === 'aud2krw'
          ? Math.round(n * fx.rate).toString()
          : (n / fx.rate).toFixed(2);
      return next;
    });
    requestAnimationFrame(() => amountRef.current?.focus());
  };

  const saveRate = () => {
    const v = Number(rateDraft);
    if (Number.isFinite(v) && v > 0) {
      setFxRate(v, 'manual');
    }
    setEditingRate(false);
  };

  if (!open) return null;

  const quick = ['5', '10', '20', '50', '100'];
  const inputLabel = direction === 'aud2krw' ? 'AUD' : 'KRW';
  const outLabel = direction === 'aud2krw' ? 'KRW' : 'AUD';
  const outText =
    direction === 'aud2krw' ? fmtKRW(computed.krw) : fmtAUD(computed.aud);

  const sourceBadge = {
    live: { text: '실시간', cls: 'bg-emerald-500 text-white' },
    manual: { text: '수동', cls: 'bg-amber-400 text-amber-950' },
    default: {
      text: '폴백',
      cls: 'bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
    },
  }[fx.source];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="환율 계산기"
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl animate-slide-up dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />

        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold text-neutral-900 dark:text-white">
            <ExchangeIcon size={18} />
            환율 계산기
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-500">
              {inputLabel}
            </span>
            <div className="flex gap-1">
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <input
            ref={amountRef}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            className="mt-1 w-full bg-transparent font-mono text-3xl font-bold tabular-nums text-neutral-900 outline-none dark:text-white"
            placeholder="0"
          />
        </div>

        <div className="my-2 flex justify-center">
          <button
            type="button"
            onClick={swap}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white shadow transition active:scale-95 hover:bg-indigo-600"
            aria-label="방향 전환"
          >
            ⇅
          </button>
        </div>

        <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:ring-indigo-900">
          <span className="text-[11px] font-semibold tracking-wider text-indigo-600 dark:text-indigo-300">
            {outLabel}
          </span>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">
            {outText}
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={[
                    'rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider',
                    sourceBadge.cls,
                  ].join(' ')}
                >
                  {sourceBadge.text}
                </span>
                <p className="text-[11px] font-semibold tracking-wider text-neutral-600 dark:text-neutral-300">
                  1 AUD = {fx.rate.toFixed(2)} KRW
                </p>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-400">
                {fmtAgo(fx.updatedAt)}
                {fx.source !== 'default' && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => resetFxRate()}
                      className="underline"
                    >
                      초기화
                    </button>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => refreshLive(false)}
                disabled={fetching}
                className="flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {fetching ? (
                  '조회 중…'
                ) : (
                  <>
                    <RefreshIcon size={12} />
                    실시간
                  </>
                )}
              </button>
              {editingRate ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={rateDraft}
                    onChange={(e) =>
                      setRateDraft(e.target.value.replace(/[^\d.]/g, ''))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRate();
                      if (e.key === 'Escape') setEditingRate(false);
                    }}
                    className="w-20 rounded-md bg-white px-2 py-1 text-right font-mono text-sm tabular-nums outline-none ring-1 ring-neutral-300 focus:ring-indigo-400 dark:bg-neutral-900 dark:ring-neutral-700"
                    placeholder="1055"
                  />
                  <button
                    type="button"
                    onClick={saveRate}
                    className="rounded-md bg-indigo-500 px-2 py-1 text-[11px] font-semibold text-white"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRateDraft(fx.rate.toFixed(2));
                    setEditingRate(true);
                  }}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600 ring-1 ring-indigo-200 transition hover:bg-indigo-50 dark:bg-neutral-900 dark:text-indigo-300 dark:ring-indigo-900"
                >
                  수동 입력
                </button>
              )}
            </div>
          </div>
          {fetchError && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-rose-500">
              <WarnIcon size={12} />
              {fetchError} · 현재 값으로 계산 중
            </p>
          )}
          <p className="mt-2 text-[10px] text-neutral-400">
            * 기본값 1055, 오프라인에선 마지막 캐시값 사용 · 출처 open.er-api.com
          </p>
        </div>
      </div>
    </div>
  );
}

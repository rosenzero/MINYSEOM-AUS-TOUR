'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  usePackingState,
  type PackingRow,
} from '@/lib/usePackingState';
import { HeaderMesh } from './HeaderMesh';

function encouragement(ratio: number, done: number, total: number) {
  if (total === 0) return '필요한 걸 추가해 보세요';
  if (done === 0) return '하나씩 차근차근 챙겨봐요';
  if (ratio >= 1) return '모두 챙겼어요';
  if (ratio >= 0.75) return '거의 다 됐어요!';
  if (ratio >= 0.5) return '절반 넘었어요';
  if (ratio >= 0.25) return '잘하고 있어요';
  return '시작이 반이에요';
}

export function Packing() {
  const { ready, items, isDone, toggle, addItem, removeItem, totals } =
    usePackingState();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header
        done={totals.done}
        total={totals.total}
        ratio={totals.ratio}
        ready={ready}
      />

      <main className="px-4 pb-32 pt-4">
        <AddBar onAdd={addItem} />

        <ul className="mt-3 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/70">
          {items.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              done={isDone(item.key)}
              onToggle={() => toggle(item.key)}
              onRemove={() => removeItem(item.key)}
            />
          ))}
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-neutral-400">
              아직 항목이 없어요
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}

function Header({
  done,
  total,
  ratio,
  ready,
}: {
  done: number;
  total: number;
  ratio: number;
  ready: boolean;
}) {
  const pct = Math.round(ratio * 100);
  const complete = ready && total > 0 && done === total;
  return (
    <header
      className={[
        'relative overflow-hidden text-white transition-colors',
        complete ? 'bg-emerald-700' : 'bg-indigo-700',
      ].join(' ')}
    >
      <HeaderMesh tone={complete ? 'emerald' : 'indigo'} />
      <div className="relative px-5 pt-5 pb-7">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition active:scale-95 hover:bg-white/30"
            aria-label="뒤로"
          >
            ‹
          </Link>
          <p className="text-xs font-medium tracking-[0.2em] text-white/80">
            PACKING LIST
          </p>
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight">
          짐 챙기기
        </h1>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
              {ready ? `${done} / ${total} 완료` : '불러오는 중…'}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-white/95">
              {ready ? encouragement(ratio, done, total) : ' '}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="font-mono text-4xl font-bold tabular-nums leading-none">
              {ready ? pct : 0}
              <span className="ml-0.5 text-base font-semibold text-white/80">%</span>
            </span>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function AddBar({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        enterKeyHint="done"
        placeholder="추가할 항목"
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-indigo-500 px-3 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-40 disabled:active:scale-100"
      >
        <span className="text-base leading-none">＋</span>
        추가
      </button>
    </form>
  );
}

function ItemRow({
  item,
  done,
  onToggle,
  onRemove,
}: {
  item: PackingRow;
  done: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const [bumpKey, setBumpKey] = useState(0);
  return (
    <li className="flex items-center">
      <button
        type="button"
        onClick={() => {
          setBumpKey((k) => k + 1);
          onToggle();
        }}
        className="flex flex-1 items-center gap-3 px-4 py-3 text-left transition active:bg-neutral-50 dark:active:bg-neutral-800/60"
      >
        <span
          key={bumpKey}
          className={[
            'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
            done
              ? 'animate-check-pop border-emerald-500 bg-emerald-500 text-white'
              : 'border-neutral-300 bg-white text-transparent dark:border-neutral-600 dark:bg-neutral-900',
          ].join(' ')}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="5 12 10 17 19 7" />
          </svg>
        </span>
        <span
          className={[
            'flex-1 text-[15px] transition-colors duration-200',
            done
              ? 'text-neutral-400 line-through decoration-neutral-300 dark:text-neutral-500 dark:decoration-neutral-700'
              : 'text-neutral-800 dark:text-neutral-100',
          ].join(' ')}
        >
          {item.name}
        </span>
      </button>
      {item.custom && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="삭제"
          className="mr-2 flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90 dark:text-neutral-600 dark:hover:bg-rose-950/40"
        >
          ×
        </button>
      )}
    </li>
  );
}

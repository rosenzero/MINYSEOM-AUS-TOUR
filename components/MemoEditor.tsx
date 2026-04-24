'use client';

import { useEffect, useRef, useState } from 'react';
import { clearMemo, getMemo, onMemoChange, setMemo } from '@/lib/memoState';
import { CheckIcon, PencilIcon, StickyNoteIcon, TrashIcon } from './Icons';

const MAX_LEN = 500;
const AUTOSAVE_MS = 600;

export function MemoEditor({ uid }: { uid: string }) {
  const [text, setText] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    setText(getMemo(uid));
    return onMemoChange(() => {
      if (!dirtyRef.current) setText(getMemo(uid));
    });
  }, [uid]);

  const commit = (value: string) => {
    setMemo(uid, value);
    dirtyRef.current = false;
    setSavedAt(Date.now());
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value.slice(0, MAX_LEN);
    setText(v);
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(v), AUTOSAVE_MS);
  };

  const onBlur = () => {
    if (!dirtyRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    commit(text);
  };

  const onClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearMemo(uid);
    setText('');
    dirtyRef.current = false;
    setSavedAt(Date.now());
  };

  const isEmpty = text.trim().length === 0;

  return (
    <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-neutral-400">
          <StickyNoteIcon size={13} />
          MEMO
        </p>
        {!isEmpty && (
          <button
            type="button"
            onClick={onClear}
            aria-label="메모 삭제"
            className="flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-neutral-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30"
          >
            <TrashIcon size={11} />
            삭제
          </button>
        )}
      </div>
      <textarea
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="이곳에 메모를 남겨보세요 (예: 예약번호, 가격, 느낀점)"
        rows={3}
        maxLength={MAX_LEN}
        className="mt-2 w-full resize-none rounded-xl bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 outline-none ring-1 ring-transparent transition focus:ring-indigo-300 dark:bg-neutral-800/60 dark:text-neutral-100 dark:focus:ring-indigo-600"
      />
      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
        <span className="flex items-center gap-1">
          {mounted && savedAt ? (
            <>
              <CheckIcon size={11} className="text-emerald-500" />
              저장됨
            </>
          ) : mounted ? (
            <>
              <PencilIcon size={11} />
              자동 저장 · 로컬에만 저장돼요
            </>
          ) : null}
        </span>
        <span className="tabular-nums">
          {text.length}/{MAX_LEN}
        </span>
      </div>
    </div>
  );
}

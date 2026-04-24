'use client';

import { useState } from 'react';
import { CheckIcon, ChatIcon, ClipboardIcon, MapIcon } from './Icons';

export function LocationActions({ location }: { location: string }) {
  const [copied, setCopied] = useState(false);

  const q = encodeURIComponent(location);
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const kakaoUrl = `https://map.kakao.com/?q=${q}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(location);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = location;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-4 space-y-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition active:scale-[0.98] hover:bg-indigo-600"
      >
        <MapIcon size={16} />
        Google Maps에서 열기
      </a>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={kakaoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex flex-col items-center justify-center rounded-2xl bg-yellow-100 px-2 py-3 text-[11px] font-semibold text-yellow-900 transition active:scale-[0.97] hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-100 dark:hover:bg-yellow-900/60"
        >
          <ChatIcon size={18} />
          <span className="mt-1 leading-tight">카카오맵</span>
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-live="polite"
          className={[
            'flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-[11px] font-medium transition active:scale-[0.97]',
            copied
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
          ].join(' ')}
        >
          {copied ? <CheckIcon size={18} /> : <ClipboardIcon size={18} />}
          <span className="mt-1 leading-tight">
            {copied ? '복사됨' : '주소 복사'}
          </span>
        </button>
      </div>
    </div>
  );
}

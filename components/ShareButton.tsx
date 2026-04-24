'use client';

import { useState } from 'react';

interface Props {
  shareTitle?: string;
  shareText?: string;
  shareUrl?: string;
  variant?: 'pill' | 'icon-light' | 'icon-dark';
  className?: string;
}

export function ShareButton({
  shareTitle,
  shareText,
  shareUrl,
  variant = 'pill',
  className = '',
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url =
      shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
    const data = { title: shareTitle, text: shareText, url };

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        const name = (e as DOMException)?.name;
        if (name === 'AbortError') return; // user cancelled
        // otherwise fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
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

  if (variant === 'icon-light' || variant === 'icon-dark') {
    const tone =
      variant === 'icon-light'
        ? 'bg-white/20 text-white hover:bg-white/30'
        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200';
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="공유"
        className={[
          'flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95',
          tone,
          className,
        ].join(' ')}
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95',
        copied
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm hover:bg-white/30',
        className,
      ].join(' ')}
    >
      {copied ? <CheckIcon /> : <ShareIcon />}
      <span>{copied ? '복사됨' : '공유'}</span>
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}

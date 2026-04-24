'use client';

import { useEffect, useState } from 'react';

export function OfflineBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed left-1/2 top-3 z-40 -translate-x-1/2 rounded-full bg-neutral-900/90 px-3 py-1 text-[11px] font-medium text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md dark:bg-neutral-100/90 dark:text-neutral-900 dark:ring-black/10"
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
      오프라인 · 캐시된 내용만 보여요
    </div>
  );
}

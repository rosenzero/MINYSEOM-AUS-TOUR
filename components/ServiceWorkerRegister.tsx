'use client';

import { useEffect } from 'react';
import { getAllEventsSorted } from '@/lib/trip';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // dev (next dev) hot-reload fights with SW caching — skip there
    if (process.env.NODE_ENV !== 'production') return;

    const onLoad = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        // best-effort: warm the cache with every event page so the full trip
        // works offline without needing to visit each one first
        const controller =
          navigator.serviceWorker.controller ??
          reg.active ??
          (await waitForActive(reg));
        const urls = [
          '/',
          '/packing/',
          ...getAllEventsSorted().map((e) => `/event/${e.uid}/`),
        ];
        await Promise.all(
          urls.map((u) =>
            fetch(u, { credentials: 'same-origin' }).catch(() => undefined)
          )
        );
        // prevent "unused var" complaints
        void controller;
      } catch {
        // ignore — offline support is an enhancement, not a requirement
      }
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
  }, []);

  return null;
}

function waitForActive(reg: ServiceWorkerRegistration): Promise<ServiceWorker | null> {
  return new Promise((resolve) => {
    if (reg.active) return resolve(reg.active);
    const sw = reg.installing ?? reg.waiting;
    if (!sw) return resolve(null);
    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') resolve(sw);
    });
  });
}

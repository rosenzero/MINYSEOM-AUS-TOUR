'use client';

import { useEffect, useState } from 'react';

export function getNow(): Date {
  return new Date();
}

export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState<Date>(() => getNow());
  useEffect(() => {
    const id = setInterval(() => setNow(getNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

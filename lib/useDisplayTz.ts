'use client';

import { useMemo } from 'react';
import { useNow } from './useNow';
import { useTzMode } from './tzState';
import { resolveTz } from './tzState';
import { getAuStartUtcMs } from './trip';

export function useDisplayTz(): string {
  const now = useNow();
  const mode = useTzMode();
  const auStart = useMemo(() => getAuStartUtcMs(), []);
  return resolveTz(mode, now, auStart);
}

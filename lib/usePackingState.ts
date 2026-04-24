'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TRIP } from './trip';

const STORAGE_KEY = 'aus_tour:packing:v1';
const CUSTOM_KEY = 'aus_tour:packing:custom:v1';

export interface PackingRow {
  key: string;
  name: string;
  custom: boolean;
}

interface CustomItem {
  id: string;
  name: string;
}

const baseRows = (): PackingRow[] =>
  TRIP.packing.map((p, idx) => ({
    key: `base::${idx}::${p.item}`,
    name: p.item,
    custom: false,
  }));

const baseDoneDefault = (): Record<string, boolean> => {
  const m: Record<string, boolean> = {};
  TRIP.packing.forEach((p, idx) => {
    if (p.done) m[`base::${idx}::${p.item}`] = true;
  });
  return m;
};

export interface PackingStateResult {
  ready: boolean;
  items: PackingRow[];
  isDone: (k: string) => boolean;
  toggle: (k: string) => void;
  addItem: (name: string) => void;
  removeItem: (k: string) => void;
  resetAll: () => void;
  totals: { done: number; total: number; ratio: number };
}

export function usePackingState(): PackingStateResult {
  const [overrides, setOverrides] = useState<Record<string, boolean> | null>(
    null
  );
  const [customs, setCustoms] = useState<CustomItem[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setOverrides(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setOverrides({});
    }
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      setCustoms(raw ? (JSON.parse(raw) as CustomItem[]) : []);
    } catch {
      setCustoms([]);
    }
  }, []);

  useEffect(() => {
    if (overrides === null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      /* ignore */
    }
  }, [overrides]);

  useEffect(() => {
    if (customs === null) return;
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs));
    } catch {
      /* ignore */
    }
  }, [customs]);

  const items = useMemo<PackingRow[]>(() => {
    const base = baseRows();
    const custom: PackingRow[] = (customs ?? []).map((c) => ({
      key: `custom::${c.id}`,
      name: c.name,
      custom: true,
    }));
    return [...base, ...custom];
  }, [customs]);

  const isDone = useCallback(
    (k: string) => {
      const eff = overrides ?? baseDoneDefault();
      if (k in eff) return eff[k];
      // base item without explicit override → default false (or json done if true)
      return false;
    },
    [overrides]
  );

  const toggle = useCallback((k: string) => {
    setOverrides((prev) => {
      const base = prev ?? baseDoneDefault();
      const cur = k in base ? base[k] : false;
      return { ...base, [k]: !cur };
    });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        /* noop */
      }
    }
  }, []);

  const addItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustoms((prev) => {
      const list = prev ?? [];
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return [...list, { id, name: trimmed }];
    });
  }, []);

  const removeItem = useCallback((k: string) => {
    if (!k.startsWith('custom::')) return;
    const id = k.slice('custom::'.length);
    setCustoms((prev) => (prev ?? []).filter((c) => c.id !== id));
    setOverrides((prev) => {
      if (!prev) return prev;
      if (!(k in prev)) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverrides({});
  }, []);

  const totals = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => isDone(i.key)).length;
    return { done, total, ratio: total === 0 ? 0 : done / total };
  }, [items, isDone]);

  return {
    ready: overrides !== null && customs !== null,
    items,
    isDone,
    toggle,
    addItem,
    removeItem,
    resetAll,
    totals,
  };
}

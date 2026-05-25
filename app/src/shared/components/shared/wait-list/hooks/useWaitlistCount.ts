// app/components/shared/wait-list/useWaitlistCount.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type WaitlistCountResult = {
  count: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type Options = {
  apiBase?: string;
  refreshIntervalMs?: number; // default: 60_000
  immediate?: boolean;        // default: true
  timeoutMs?: number;         // default: 8000
};

async function fetchJSON(url: string, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({} as any));
    return { res, data };
  } finally {
    clearTimeout(t);
  }
}

export default function useWaitlistCount(options: Options = {}): WaitlistCountResult {
  const {
    apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://saturnusgo-backend-production.up.railway.app',
    refreshIntervalMs = 60_000,
    immediate = true,
    timeoutMs = 8000,
  } = options;

  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(!!immediate);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const myId = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const { res, data } = await fetchJSON(`${apiBase}/api/get-into/waitlist/count`, timeoutMs);
      // игнорируем устаревший ответ
      if (myId !== reqIdRef.current) return;

      const n = typeof data?.count === 'string' ? parseInt(data.count, 10) : data?.count;
      if (Number.isFinite(n)) {
        setCount(n as number);
      } else if (!res.ok) {
        setError(`HTTP ${res.status}`);
      }
    } catch (e: any) {
      // abort из таймаута → это не наш StrictMode-цикл
      setError(e?.name === 'AbortError' ? 'Timeout' : (e?.message || 'Failed to load'));
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, [apiBase, timeoutMs]);

  // старт/стоп интервального опроса только когда вкладка видима
  useEffect(() => {
    function start() {
      if (timerRef.current != null || refreshIntervalMs <= 0) return;
      timerRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') void refresh();
      }, refreshIntervalMs) as unknown as number;
    }
    function stop() {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    if (immediate && document.visibilityState === 'visible') void refresh();
    start();

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        start();
      } else {
        stop();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    // ВАЖНО: не отменяем активный fetch в cleanup → не создаём 499
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      stop();
    };
  }, [immediate, refreshIntervalMs, refresh]);

  return { count, loading, error, refresh };
}

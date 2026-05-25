"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CORE_HOME_API_BASE } from "../../../constants";
import type { WaitlistCountOptions } from "../../../types";

type WaitlistCountResult = {
  count: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type WaitlistCountResponse = {
  count?: number | string;
};

const DEFAULT_REFRESH_INTERVAL_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 8000;

export default function useWaitlistCount(options: WaitlistCountOptions = {}): WaitlistCountResult {
  const apiBase = options.apiBase ?? CORE_HOME_API_BASE;
  const refreshIntervalMs = options.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS;
  const immediate = options.immediate ?? true;
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const { response, data } = await fetchWaitlistCount(`${apiBase}/api/get-into/waitlist/count`, DEFAULT_TIMEOUT_MS);

      if (requestId !== requestIdRef.current) {
        return;
      }

      const nextCount = normalizeWaitlistCount(data.count);

      if (nextCount !== null) {
        setCount(nextCount);
        return;
      }

      if (!response.ok) {
        setError(`HTTP ${response.status}`);
      }
    } catch (caughtError) {
      setError(resolveFetchErrorMessage(caughtError));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [apiBase]);

  useEffect(() => {
    const start = () => {
      if (timerRef.current !== null || refreshIntervalMs <= 0) {
        return;
      }

      timerRef.current = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          void refresh();
        }
      }, refreshIntervalMs);
    };

    const stop = () => {
      if (timerRef.current === null) {
        return;
      }

      window.clearInterval(timerRef.current);
      timerRef.current = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        start();
        return;
      }

      stop();
    };

    if (immediate && document.visibilityState === "visible") {
      void refresh();
    }

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stop();
    };
  }, [immediate, refresh, refreshIntervalMs]);

  return { count, loading, error, refresh };
}

async function fetchWaitlistCount(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({} as WaitlistCountResponse)) as WaitlistCountResponse;

    return { response, data };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function normalizeWaitlistCount(value: WaitlistCountResponse["count"]): number | null {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;

  return Number.isFinite(parsed) ? parsed as number : null;
}

function resolveFetchErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Timeout";
  }

  return error instanceof Error ? error.message : "Failed to load";
}

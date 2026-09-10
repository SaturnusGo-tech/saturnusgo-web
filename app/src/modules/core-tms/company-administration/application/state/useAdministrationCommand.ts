"use client";

import { useEffect, useRef, useState } from "react";
import { AdministrationError } from "../../domain/administration";

export function useAdministrationCommand() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flight = useRef<AbortController | null>(null);
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => () => { flight.current?.abort(); flight.current = null; retry.current = null; }, []);
  async function execute<T>(fingerprint: string, operation: (key: string, signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    if (flight.current) return undefined;
    const controller = new AbortController(); flight.current = controller;
    if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, key: crypto.randomUUID() };
    setPending(true); setError(null);
    try {
      const result = await operation(retry.current.key, controller.signal);
      if (controller.signal.aborted) return undefined;
      retry.current = null;
      return result;
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof AdministrationError ? failure.code : "SERVICE_UNAVAILABLE");
      return undefined;
    } finally {
      if (flight.current === controller) {
        flight.current = null;
        if (!controller.signal.aborted) setPending(false);
      }
    }
  }
  return { execute, pending, error, clearError: () => setError(null) };
}

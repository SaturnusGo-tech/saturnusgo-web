"use client";

import { useCallback, useEffect, useState } from "react";
import { AdministrationError } from "../../domain/administration";

export function useAdministrationResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ owner: typeof load; loading: boolean; refreshing: boolean; value: T | null; error: string | null }>(
    { owner: load, loading: true, refreshing: false, value: null, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => current.owner === load && current.value !== null
      ? { ...current, refreshing: true, error: null }
      : { owner: load, loading: true, refreshing: false, value: null, error: null });
    load(controller.signal).then((value) => {
      if (!controller.signal.aborted) setState({ owner: load, loading: false, refreshing: false, value, error: null });
    }).catch((error) => {
      if (!controller.signal.aborted) setState((current) => {
        const code = error instanceof AdministrationError ? error.code : "SERVICE_UNAVAILABLE";
        const denied = ["SESSION_REQUIRED", "ACCESS_DENIED", "TENANT_UNAVAILABLE", "NOT_FOUND"].includes(code);
        return { ...current, loading: false, refreshing: false, value: denied ? null : current.value, error: code };
      });
    });
    return () => controller.abort();
  }, [load, version]);
  const visible = state.owner === load ? state : { loading: true, refreshing: false, value: null, error: null };
  return { ...visible, refresh: useCallback(() => setVersion((value) => value + 1), []) };
}

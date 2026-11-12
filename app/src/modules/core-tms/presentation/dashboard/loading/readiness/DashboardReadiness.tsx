"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Registration = (id: object, pending: boolean) => () => void;
const ReadinessContext = createContext<Registration | null>(null);
const QUIET_WINDOW_MS = 32;

/** Keeps the first dashboard reveal covered until mounted widgets finish their initial reads. */
export function DashboardReadiness({ pending, children }: {
  pending: boolean;
  children: (covered: boolean) => ReactNode;
}) {
  const [covered, setCovered] = useState(true);
  const [revision, updateRevision] = useState(0);
  const registry = useRef(new Set<object>());
  const mounted = useRef(false);
  const sealed = useRef(false);
  const basePending = useRef(pending);
  basePending.current = pending;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelQuietWindow = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const register = useCallback<Registration>((id, widgetPending) => {
    if (sealed.current) return () => undefined;
    cancelQuietWindow();
    if (widgetPending) registry.current.add(id);
    else registry.current.delete(id);
    if (mounted.current) updateRevision(value => value + 1);
    return () => {
      if (sealed.current || !registry.current.delete(id)) return;
      cancelQuietWindow();
      if (mounted.current) updateRevision(value => value + 1);
    };
  }, [cancelQuietWindow]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; cancelQuietWindow(); };
  }, [cancelQuietWindow]);

  useEffect(() => {
    cancelQuietWindow();
    if (sealed.current || pending || registry.current.size) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!mounted.current || sealed.current || basePending.current || registry.current.size) return;
      sealed.current = true;
      registry.current.clear();
      setCovered(false);
    }, QUIET_WINDOW_MS);
    return cancelQuietWindow;
  }, [pending, revision, cancelQuietWindow]);

  return <ReadinessContext.Provider value={register}>{children(covered)}</ReadinessContext.Provider>;
}

/** A pending widget outside the initial dashboard boundary keeps its normal local feedback. */
export function useDashboardWidgetPending(pending: boolean) {
  const register = useContext(ReadinessContext);
  const id = useRef<object>({});
  useLayoutEffect(() => register?.(id.current, pending), [register, pending]);
}

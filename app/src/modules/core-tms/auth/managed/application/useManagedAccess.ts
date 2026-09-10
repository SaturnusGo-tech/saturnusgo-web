"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ManagedAccessPort } from "./managed-access-port";
import { CompanyAccessError, type CompanyEntrypoint, type CompanySession, type MfaEnrollment }
  from "../domain/managed-access";

export interface ManagedAccessState {
  readonly loading: boolean;
  readonly pending: boolean;
  readonly entrypoint: CompanyEntrypoint | null;
  readonly session: CompanySession | null;
  readonly error: string | null;
  readonly enrollment: MfaEnrollment | null;
  readonly recoveryCodes: readonly string[];
}
const initial: ManagedAccessState = { loading: true, pending: false, entrypoint: null,
  session: null, error: null, enrollment: null, recoveryCodes: [] };

export function useManagedAccess(client: ManagedAccessPort) {
  const [state, setState] = useState(initial);
  const current = useRef<AbortController | null>(null);
  const pending = useRef(false);

  const refresh = useCallback(async () => {
    current.current?.abort();
    const controller = new AbortController(); current.current = controller;
    setState((value) => ({ ...value, loading: true, error: null }));
    try {
      const entrypoint = await client.entrypoint(controller.signal);
      const session = entrypoint.available ? await client.session(controller.signal) : null;
      if (!controller.signal.aborted) setState((value) => ({ ...value, entrypoint, session, loading: false }));
    } catch (error) {
      if (!controller.signal.aborted) setState((value) => ({ ...value, loading: false,
        error: error instanceof CompanyAccessError ? error.code : "SERVICE_UNAVAILABLE",
        ...(error instanceof CompanyAccessError && error.code === "SESSION_REQUIRED"
          ? { session: { authenticated: false, stage: "anonymous" } as const, enrollment: null, recoveryCodes: [] } : {}) }));
    }
  }, [client]);

  useEffect(() => { void refresh(); return () => { current.current?.abort(); pending.current = false; }; }, [refresh]);

  const expiresAt = state.session && "expiresAt" in state.session ? state.session.expiresAt : null;
  useEffect(() => {
    if (!expiresAt || state.pending || typeof window === "undefined") return;
    const controller = new AbortController();
    let checking = false;
    const check = async () => {
      if (checking || pending.current || document.visibilityState === "hidden") return;
      checking = true;
      try {
        const session = await client.session(controller.signal);
        if (!controller.signal.aborted) setState((value) => JSON.stringify(value.session) === JSON.stringify(session) ? value
          : { ...value, session, enrollment: null, recoveryCodes: [], error: null });
      } catch (error) {
        if (!controller.signal.aborted && error instanceof CompanyAccessError &&
          ["SESSION_REQUIRED", "TENANT_UNAVAILABLE", "ACCESS_DENIED"].includes(error.code)) {
          setState((value) => ({ ...value, session: { authenticated: false, stage: "anonymous" }, enrollment: null, recoveryCodes: [], error: error.code }));
        }
      } finally { checking = false; }
    };
    const onFocus = () => { void check(); };
    const timeout = window.setTimeout(onFocus, Math.max(0, Date.parse(expiresAt) - Date.now()));
    const interval = window.setInterval(onFocus, 60_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { controller.abort(); window.clearTimeout(timeout); window.clearInterval(interval);
      window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [client, expiresAt, state.pending]);

  const perform = async (operation: (signal: AbortSignal) => Promise<Partial<ManagedAccessState> | void>, propagateError = false) => {
    if (pending.current) return;
    pending.current = true;
    current.current?.abort();
    const controller = new AbortController(); current.current = controller;
    setState((value) => ({ ...value, pending: true, error: null }));
    try {
      const change = await operation(controller.signal);
      const session = await client.session(controller.signal);
      if (!controller.signal.aborted) setState((value) => ({ ...value, ...change, session, pending: false, enrollment: null }));
    } catch (error) {
      if (!controller.signal.aborted) setState((value) => ({ ...value, pending: false,
        error: error instanceof CompanyAccessError ? error.code : "SERVICE_UNAVAILABLE",
        ...(error instanceof CompanyAccessError && error.code === "SESSION_REQUIRED"
          ? { session: { authenticated: false, stage: "anonymous" } as const, enrollment: null, recoveryCodes: [] } : {}) }));
      if (propagateError && !controller.signal.aborted) throw error;
    } finally { pending.current = false; }
  };

  const prepareMfa = async () => {
    if (pending.current) return;
    pending.current = true;
    const controller = new AbortController(); current.current?.abort(); current.current = controller;
    setState((value) => ({ ...value, pending: true, error: null }));
    try {
      const enrollment = await client.prepareMfa(controller.signal);
      if (!controller.signal.aborted) setState((value) => ({ ...value, pending: false, enrollment }));
    } catch (error) {
      if (!controller.signal.aborted) setState((value) => ({ ...value, pending: false,
        error: error instanceof CompanyAccessError ? error.code : "SERVICE_UNAVAILABLE",
        ...(error instanceof CompanyAccessError && error.code === "SESSION_REQUIRED"
          ? { session: { authenticated: false, stage: "anonymous" } as const, enrollment: null, recoveryCodes: [] } : {}) }));
    } finally { pending.current = false; }
  };

  return { state, refresh, prepareMfa,
    login: (login: string, password: string) => perform((signal) => client.login({ login, password }, signal)),
    firstPassword: (password: string) => perform((signal) => client.firstPassword(password, signal)),
    verify: (kind: "totp" | "recovery", code: string) => perform(async (signal) => {
      const result = await client.verifyMfa(kind, code, signal); return { recoveryCodes: result.recoveryCodes };
    }),
    logout: () => perform((signal) => client.logout(signal), true),
    acknowledgeCodes: () => setState((value) => ({ ...value, recoveryCodes: [] })),
  };
}

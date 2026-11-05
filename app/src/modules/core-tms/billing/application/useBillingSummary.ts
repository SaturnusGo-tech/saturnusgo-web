"use client";
import { useCallback, useEffect, useState } from "react";
import { billingFailure, type BillingFailure, type BillingSummary } from "../domain/billing";
import type { BillingPort } from "../domain/billing-port";
export interface BillingSummaryOptions { readonly port: BillingPort | null; readonly workspaceId: string | null; readonly enabled?: boolean }
export function useBillingSummary({ port, workspaceId, enabled = true }: BillingSummaryOptions) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ port: BillingPort | null; workspaceId: string | null; summary: BillingSummary | null; loading: boolean; error: BillingFailure | null }>({ port, workspaceId, summary: null, loading: Boolean(enabled && port && workspaceId), error: null });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const changed = (event: Event) => {
      if ((event as CustomEvent<{ workspaceId?: string }>).detail?.workspaceId === workspaceId) setRevision(value => value + 1);
    };
    window.addEventListener("falcon:billing-changed", changed);
    return () => window.removeEventListener("falcon:billing-changed", changed);
  }, [workspaceId]);
  useEffect(() => {
    const controller = new AbortController();
    setState(value => ({ port, workspaceId, summary: enabled && value.port === port && value.workspaceId === workspaceId ? value.summary : null, loading: Boolean(enabled && port && workspaceId), error: null }));
    if (enabled && port && workspaceId) void port.summary(workspaceId, controller.signal).then(summary => {
      if (!controller.signal.aborted) setState({ port, workspaceId, summary, loading: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ port, workspaceId, summary: null, loading: false, error: billingFailure(error) });
    });
    return () => controller.abort();
  }, [port, workspaceId, enabled, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const current = enabled && state.port === port && state.workspaceId === workspaceId ? state : { summary: null, loading: Boolean(enabled && port && workspaceId), error: null };
  return { summary: current.summary, loading: current.loading, error: current.error, reload };
}

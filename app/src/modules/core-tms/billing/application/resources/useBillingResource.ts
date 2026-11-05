import { useCallback, useEffect, useRef, useState } from "react";
import { billingFailure, type BillingAccount, type BillingFailure, type BillingInvoice, type BillingMutation } from "../../domain/billing";
import type { BillingPort } from "../../domain/billing-port";
interface State { port: BillingPort | null; workspaceId: string | null; account: BillingAccount | null; invoices: readonly BillingInvoice[]; loading: boolean; loadingMore: boolean; hasMoreInvoices: boolean; error: BillingFailure | null; invoicesError: BillingFailure | null }
const empty = (port: BillingPort | null, workspaceId: string | null, loading: boolean): State => ({ port, workspaceId, account: null, invoices: [], loading, loadingMore: false, hasMoreInvoices: false, error: null, invoicesError: null });
export function useBillingResource(port: BillingPort | null, workspaceId: string | null, enabled: boolean) {
  const [state, setState] = useState(() => empty(port, workspaceId, enabled));
  const [revision, setRevision] = useState(0);
  const active = useRef<AbortController | null>(null); const more = useRef<AbortController | null>(null);
  const owner = useRef({ port, workspaceId, enabled }); owner.current = { port, workspaceId, enabled };
  const owns = () => owner.current.port === port && owner.current.workspaceId === workspaceId && owner.current.enabled === enabled;
  useEffect(() => {
    const controller = new AbortController(); active.current = controller;
    setState(value => value.port === port && value.workspaceId === workspaceId && enabled ? { ...value, loading: true, error: null, invoicesError: null } : empty(port, workspaceId, enabled));
    if (enabled && port && workspaceId) void Promise.allSettled([port.read(workspaceId, controller.signal), port.invoices(workspaceId, {}, controller.signal)]).then(([account, invoices]) => {
      if (controller.signal.aborted || !owns()) return;
      setState({ ...empty(port, workspaceId, false), account: account.status === "fulfilled" ? account.value : null,
        invoices: invoices.status === "fulfilled" ? invoices.value.data : [], hasMoreInvoices: invoices.status === "fulfilled" && invoices.value.data.length === invoices.value.meta.limit,
        error: account.status === "rejected" ? billingFailure(account.reason) : null, invoicesError: invoices.status === "rejected" ? billingFailure(invoices.reason) : null });
    });
    return () => { controller.abort(); more.current?.abort(); more.current = null; };
  }, [port, workspaceId, enabled, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const current = enabled && state.port === port && state.workspaceId === workspaceId ? state : empty(port, workspaceId, enabled);
  async function loadMoreInvoices() {
    const last = current.invoices[current.invoices.length - 1];
    const before = last?.periodStart;
    if (!enabled || !port || !workspaceId || !before || !current.hasMoreInvoices || current.loading || more.current) return;
    const controller = new AbortController(); more.current = controller;
    setState(value => ({ ...value, loadingMore: true, invoicesError: null }));
    try {
      const page = await port.invoices(workspaceId, { before, beforeId: last.id }, controller.signal);
      if (!controller.signal.aborted && owns()) setState(value => ({ ...value, loadingMore: false, hasMoreInvoices: page.data.length === page.meta.limit,
        invoices: [...value.invoices, ...page.data.filter(row => !value.invoices.some(existing => existing.id === row.id))] }));
    } catch (error) { if (!controller.signal.aborted && owns()) setState(value => ({ ...value, loadingMore: false, invoicesError: billingFailure(error) })); }
    finally { if (more.current === controller) more.current = null; }
  }
  function applyMutation(result: BillingMutation) {
    if (!owns()) return;
    active.current?.abort(); more.current?.abort(); more.current = null;
    setState(value => ({ ...value, loading: false, loadingMore: false,
      account: value.account ? { ...value.account, subscription: result.subscription ?? value.account.subscription, checkout: result.checkout ? (result.checkout.status === "open" ? result.checkout : null) : value.account.checkout } : null,
      invoices: result.invoice ? [result.invoice, ...value.invoices.filter(row => row.id !== result.invoice?.id)] : value.invoices }));
  }
  return { ...current, reload, loadMoreInvoices, applyMutation };
}

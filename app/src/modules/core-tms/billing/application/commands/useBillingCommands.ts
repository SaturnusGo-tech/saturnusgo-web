import { useEffect, useRef, useState } from "react";
import { billingFailure, versionedBillingIntent, type BillingAccount, type BillingFailure, type BillingIntent, type BillingMutation, type BillingSummary } from "../../domain/billing";
import type { BillingPort } from "../../domain/billing-port";
import { restoreIdentityCheckout, storeIdentityCheckout, type BillingCommand } from "./reauthentication-checkout";
import { activeStartupWorkspace } from "../../startup/domain/completed-startup";
interface Options { port: BillingPort | null; workspaceId: string | null; enabled: boolean; account: BillingAccount | null; summary?: BillingSummary | null; reauthenticationScope?: string; onResult(result: BillingMutation, replay: boolean): void; onConflict(): void }
export function useBillingCommands(options: Options) {
  const { port, workspaceId, enabled, account, reauthenticationScope } = options;
  const [state, setState] = useState<{ port: BillingPort | null; workspaceId: string | null; reauthenticationScope?: string; busy: boolean; error: BillingFailure | null; canRetryCommand: boolean; result: BillingMutation | null }>({ port, workspaceId, reauthenticationScope, busy: false, error: null, canRetryCommand: false, result: null });
  const active = useRef<AbortController | null>(null); const retry = useRef<BillingCommand | null>(null);
  const owner = useRef({ port, workspaceId, enabled, reauthenticationScope }); owner.current = { port, workspaceId, enabled, reauthenticationScope };
  const callbacks = useRef(options); callbacks.current = options;
  const owns = () => owner.current.port === port && owner.current.workspaceId === workspaceId && owner.current.enabled === enabled && owner.current.reauthenticationScope === reauthenticationScope;
  useEffect(() => {
    retry.current = enabled && workspaceId ? restoreIdentityCheckout(reauthenticationScope, workspaceId) : null;
    setState(value => ({ port, workspaceId, reauthenticationScope, busy: false, error: retry.current ? { code: "BILLING_ACTION_PENDING", requestId: null, retryable: true } : null, canRetryCommand: !!retry.current,
      result: value.port === port && value.workspaceId === workspaceId && value.reauthenticationScope === reauthenticationScope && value.result?.checkout?.status === "completed" ? value.result : null }));
    return () => { active.current?.abort(); active.current = null; retry.current = null; };
  }, [port, workspaceId, enabled, reauthenticationScope]);
  async function execute(intent: BillingIntent, replay = false) {
    if (!port || !workspaceId || !enabled || !owns() || active.current || (!replay && retry.current)) return;
    const command = replay ? retry.current : { intent, options: { idempotencyKey: crypto.randomUUID(), version: account?.subscription?.version } };
    if (!command || (versionedBillingIntent(command.intent) && !command.options.version)) return;
    const controller = new AbortController(); active.current = controller;
    setState(value => ({ ...value, busy: true, error: null }));
    try {
      const result = await port.execute(workspaceId, command.intent, { ...command.options, signal: controller.signal });
      if (controller.signal.aborted || !owns()) return;
      retry.current = null; storeIdentityCheckout(reauthenticationScope, workspaceId, null); setState({ port, workspaceId, reauthenticationScope, busy: false, error: null, canRetryCommand: false, result });
      callbacks.current.onResult(result, replay);
    } catch (error) {
      if (controller.signal.aborted || !owns()) return;
      const failure = billingFailure(error), needsIdentity = failure.code === "REAUTHENTICATION_REQUIRED";
      retry.current = failure.retryable || needsIdentity ? command : null;
      if (needsIdentity || !failure.retryable) storeIdentityCheckout(reauthenticationScope, workspaceId,
        needsIdentity && (command.intent.kind !== "confirm" || account?.checkout?.planId === "startup") ? command : null);
      setState(value => ({ ...value, busy: false, error: failure, canRetryCommand: !!retry.current,
        result: failure.code === "BILLING_CHECKOUT_EXPIRED" && value.result?.checkout ? { ...value.result, checkout: { ...value.result.checkout, status: "expired" } } : value.result }));
      if (["BILLING_VERSION_CONFLICT", "PRECONDITION_REQUIRED", "BILLING_CHECKOUT_EXPIRED", "BILLING_STARTUP_SETUP_REQUIRED"].includes(failure.code)) callbacks.current.onConflict();
    } finally { if (active.current === controller) active.current = null; }
  }
  const sameOwner = state.port === port && state.workspaceId === workspaceId && state.reauthenticationScope === reauthenticationScope;
  // A completed receipt is recovery metadata, never authorization for another command.
  const current = sameOwner && enabled ? state : { busy: false, error: null, canRetryCommand: false,
    result: sameOwner && state.result?.checkout?.status === "completed" ? state.result : null };
  const pendingCommand = current.error?.code === "BILLING_ACTION_PENDING" ? retry.current : null;
  useEffect(() => {
    if (!workspaceId || !enabled || !owns() || active.current || !pendingCommand || !activeStartupWorkspace(options.summary ?? null, account, workspaceId)) return;
    // A settled server subscription wins over optional, stale browser recovery metadata.
    retry.current = null; storeIdentityCheckout(reauthenticationScope, workspaceId, null);
    setState(value => ({ ...value, error: null, canRetryCommand: false }));
  }, [pendingCommand, account, options.summary, workspaceId, enabled, reauthenticationScope]);
  return { ...current, pendingCommand, execute, dismissError: () => { if (owns() && !active.current && !retry.current) setState(value => ({ ...value, error: null })); },
    retryCommand: async () => { if (retry.current) await execute(retry.current.intent, true); } };
}

import { useEffect, useRef, useState } from "react";
import { billingFailure, versionedBillingIntent, type BillingAccount, type BillingFailure, type BillingIntent, type BillingMutation } from "../../domain/billing";
import type { BillingCommandOptions, BillingPort } from "../../domain/billing-port";
interface Command { intent: BillingIntent; options: BillingCommandOptions }
interface Options { port: BillingPort | null; workspaceId: string | null; enabled: boolean; account: BillingAccount | null; onResult(result: BillingMutation, replay: boolean): void; onConflict(): void }
export function useBillingCommands(options: Options) {
  const { port, workspaceId, enabled, account } = options;
  const [state, setState] = useState<{ port: BillingPort | null; workspaceId: string | null; busy: boolean; error: BillingFailure | null; canRetryCommand: boolean; result: BillingMutation | null }>({ port, workspaceId, busy: false, error: null, canRetryCommand: false, result: null });
  const active = useRef<AbortController | null>(null); const retry = useRef<Command | null>(null);
  const owner = useRef({ port, workspaceId, enabled }); owner.current = { port, workspaceId, enabled };
  const callbacks = useRef(options); callbacks.current = options;
  const owns = () => owner.current.port === port && owner.current.workspaceId === workspaceId && owner.current.enabled === enabled;
  useEffect(() => {
    retry.current = null; setState({ port, workspaceId, busy: false, error: null, canRetryCommand: false, result: null });
    return () => { active.current?.abort(); active.current = null; retry.current = null; };
  }, [port, workspaceId, enabled]);
  async function execute(intent: BillingIntent, replay = false) {
    if (!port || !workspaceId || !enabled || !owns() || active.current || (!replay && retry.current)) return;
    const command = replay ? retry.current : { intent, options: { idempotencyKey: crypto.randomUUID(), version: account?.subscription?.version } };
    if (!command || (versionedBillingIntent(command.intent) && !command.options.version)) return;
    const controller = new AbortController(); active.current = controller;
    setState(value => ({ ...value, busy: true, error: null }));
    try {
      const result = await port.execute(workspaceId, command.intent, { ...command.options, signal: controller.signal });
      if (controller.signal.aborted || !owns()) return;
      retry.current = null; setState({ port, workspaceId, busy: false, error: null, canRetryCommand: false, result });
      callbacks.current.onResult(result, replay);
    } catch (error) {
      if (controller.signal.aborted || !owns()) return;
      const failure = billingFailure(error); retry.current = failure.retryable ? command : null;
      setState(value => ({ ...value, busy: false, error: failure, canRetryCommand: failure.retryable,
        result: failure.code === "BILLING_CHECKOUT_EXPIRED" && value.result?.checkout ? { ...value.result, checkout: { ...value.result.checkout, status: "expired" } } : value.result }));
      if (failure.code === "BILLING_VERSION_CONFLICT" || failure.code === "PRECONDITION_REQUIRED" || failure.code === "BILLING_CHECKOUT_EXPIRED") callbacks.current.onConflict();
    } finally { if (active.current === controller) active.current = null; }
  }
  const current = state.port === port && state.workspaceId === workspaceId && enabled ? state : { busy: false, error: null, canRetryCommand: false, result: null };
  return { ...current, execute, retryCommand: async () => { if (retry.current) await execute(retry.current.intent, true); } };
}

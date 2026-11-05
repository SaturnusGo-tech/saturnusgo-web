"use client";
import type { BillingOutcome, BillingPlanId, BillingIntent } from "../domain/billing";
import type { BillingPort } from "../domain/billing-port";
import { useBillingSummary } from "./useBillingSummary";
import { useBillingResource } from "./resources/useBillingResource";
import { useBillingCommands } from "./commands/useBillingCommands";
export interface BillingOptions { readonly port: BillingPort | null; readonly workspaceId: string | null; readonly canManage: boolean; readonly workspaceKind: "personal" | "company"; readonly reauthenticationScope?: string }
export function useBilling({ port, workspaceId, canManage, workspaceKind, reauthenticationScope }: BillingOptions) {
  const summary = useBillingSummary({ port, workspaceId });
  const manageable = canManage && summary.summary?.canManage === true;
  const resource = useBillingResource(port, workspaceId, manageable);
  const reload = () => { summary.reload(); resource.reload(); };
  const commands = useBillingCommands({ port, workspaceId, enabled: manageable, account: resource.account, reauthenticationScope,
    onResult: (result, replay) => {
      if (replay) resource.reload(); else {
        resource.applyMutation(result);
        if (result.checkout?.status === "completed") resource.reload();
      }
      summary.reload();
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("falcon:billing-changed", { detail: { workspaceId } }));
    }, onConflict: resource.reload });
  const checkout = resource.account?.checkout ?? (commands.result?.checkout?.status !== "open" ? commands.result?.checkout : null) ?? null;
  const allowedCheckout = (planId: BillingPlanId) => resource.account?.allowedCheckoutPlanIds.some(id => id === planId);
  const allowedChange = (planId: BillingPlanId) => resource.account?.allowedChangePlanIds.some(id => id === planId);
  return { summary: summary.summary, account: resource.account, invoices: resource.invoices, checkout,
    lastMutation: commands.result, loading: summary.loading || resource.loading, busy: commands.busy,
    error: commands.error ?? summary.error ?? resource.error, invoicesError: resource.invoicesError,
    canManage: manageable, canRetryCommand: commands.canRetryCommand, hasMoreInvoices: resource.hasMoreInvoices, loadingMoreInvoices: resource.loadingMore,
    reload, loadMoreInvoices: resource.loadMoreInvoices, retryCommand: commands.retryCommand,
    startCheckout: async (planId: BillingPlanId, conversion?: Pick<Extract<BillingIntent, { kind: "checkout" }>, "startupSetupId" | "startupSetupVersion" | "confirmWorkspaceConversion">) => { if (allowedCheckout(planId)) await commands.execute({ kind: "checkout", planId, ...conversion }); },
    confirmCheckout: async (outcome: BillingOutcome) => { if (checkout?.status === "open") await commands.execute({ kind: "confirm", checkoutId: checkout.id, outcome }); },
    changePlan: async (planId: BillingPlanId) => { if (allowedChange(planId)) await commands.execute({ kind: "plan", planId }); },
    cancel: async () => commands.execute({ kind: "cancel" }), resume: async () => commands.execute({ kind: "resume" }),
    retryPayment: async () => commands.execute({ kind: "retry" }), setMockOutcome: async (outcome: BillingOutcome) => { if (resource.account?.testMode) await commands.execute({ kind: "mockOutcome", outcome }); },
  };
}

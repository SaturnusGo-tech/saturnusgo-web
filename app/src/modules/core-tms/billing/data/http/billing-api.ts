import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { BillingAccount, BillingIntent, BillingInvoicePage, BillingMutation, BillingSummary } from "../../domain/billing";
import { versionedBillingIntent } from "../../domain/billing";
import type { BillingCommandOptions, BillingPort } from "../../domain/billing-port";
type Schemas = components["schemas"];
function command(workspaceId: string, intent: BillingIntent) {
  switch (intent.kind) {
    case "checkout": return { path: "/billing/checkout", body: { workspaceId, planId: intent.planId, ...(intent.startupSetupId ? { startupSetupId: intent.startupSetupId, startupSetupVersion: intent.startupSetupVersion, confirmWorkspaceConversion: intent.confirmWorkspaceConversion } : {}) } satisfies Schemas["BillingCheckoutRequest"] };
    case "confirm": return { path: "/billing/confirm", body: { workspaceId, checkoutId: intent.checkoutId, outcome: intent.outcome } satisfies Schemas["BillingConfirmRequest"] };
    case "retry": return { path: "/billing/retry", body: { workspaceId } satisfies Schemas["BillingScopeRequest"] };
    case "mockOutcome": return { path: "/billing/mock/outcome", body: { workspaceId, outcome: intent.outcome } satisfies Schemas["BillingOutcomeRequest"] };
    case "plan": return { path: "/billing/subscription", body: { workspaceId, kind: intent.kind, planId: intent.planId } satisfies Schemas["BillingSubscriptionRequest"] };
    default: return { path: "/billing/subscription", body: { workspaceId, kind: intent.kind } satisfies Schemas["BillingSubscriptionRequest"] };
  }
}
export function createBillingApi(client: TmsHttpClient): BillingPort {
  const query = (workspaceId: string) => new URLSearchParams({ workspaceId });
  return {
    summary: async (workspaceId, signal) => (await client.getResource<BillingSummary>(`/billing/summary?${query(workspaceId)}`, signal)).data,
    read: async (workspaceId, signal) => (await client.getResource<BillingAccount>(`/billing?${query(workspaceId)}`, signal)).data,
    invoices: async (workspaceId, options = {}, signal) => {
      const params = query(workspaceId); params.set("limit", String(options.limit ?? 30));
      if (options.before) params.set("before", options.before);
      if (options.beforeId) params.set("beforeId", options.beforeId);
      return client.get<BillingInvoicePage>(`/billing/invoices?${params}`, signal);
    },
    execute: async (workspaceId: string, intent: BillingIntent, options: BillingCommandOptions): Promise<BillingMutation> => {
      const versioned = versionedBillingIntent(intent);
      if (versioned && (!Number.isSafeInteger(options.version) || options.version! < 1)) throw new Error("A current subscription version is required.");
      const request = command(workspaceId, intent);
      return (await client.mutateResource<BillingMutation>(request.path, "POST", request.body, {
        signal: options.signal, idempotencyKey: options.idempotencyKey,
        ifMatch: versioned ? `"${options.version}"` : undefined,
      })).data;
    },
  };
}

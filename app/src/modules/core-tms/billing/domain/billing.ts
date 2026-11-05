import type { components } from "../../../../core/tms/generated/tms-api";
type Schemas = components["schemas"];
export type BillingPlan = Schemas["BillingPlan"];
export type BillingPlanId = Schemas["BillingSubscription"]["planId"];
export type BillingSubscription = Schemas["BillingSubscription"];
export type BillingCheckout = Schemas["BillingCheckout"];
export type BillingInvoice = Schemas["BillingInvoice"];
export type BillingAccount = Schemas["BillingReadEnvelope"]["data"];
export type BillingSummary = Schemas["BillingSummaryEnvelope"]["data"];
export type BillingMutation = Schemas["BillingMutationEnvelope"]["data"];
export type BillingInvoicePage = Schemas["BillingInvoiceListEnvelope"];
export type BillingOutcome = Schemas["BillingConfirmRequest"]["outcome"];
export type BillingIntent =
  | { readonly kind: "checkout"; readonly planId: BillingPlanId; readonly startupSetupId?: string; readonly startupSetupVersion?: number; readonly confirmWorkspaceConversion?: true }
  | { readonly kind: "plan"; readonly planId: BillingPlanId }
  | { readonly kind: "confirm"; readonly checkoutId: string; readonly outcome: BillingOutcome }
  | { readonly kind: "cancel" | "resume" | "retry" }
  | { readonly kind: "mockOutcome"; readonly outcome: BillingOutcome };
export interface BillingFailure { readonly code: string; readonly requestId: string | null; readonly retryable: boolean }
export function billingFailure(error: unknown): BillingFailure {
  const value = error && typeof error === "object" ? error as { code?: unknown; status?: unknown; requestId?: unknown } : {};
  return { code: typeof value.code === "string" ? value.code : "SERVICE_UNAVAILABLE",
    requestId: typeof value.requestId === "string" ? value.requestId : null,
    retryable: value.status === undefined || value.status === 408 || value.status === 429 || (typeof value.status === "number" && value.status >= 500) };
}
export function versionedBillingIntent(intent: BillingIntent) {
  return intent.kind === "plan" || intent.kind === "cancel" || intent.kind === "resume" || intent.kind === "retry";
}

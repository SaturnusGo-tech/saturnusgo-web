import type { BillingAccount, BillingInvoice, BillingMutation, BillingSubscription, BillingSummary } from "../../domain/billing";
import type { BillingPort } from "../../domain/billing-port";
export const subscription: BillingSubscription = { id: "subscription", workspaceId: "workspace", provider: "mock", testMode: true, planId: "startup", status: "active", seats: 5, amount: 5900, currency: "USD", periodStart: "2026-11-01T00:00:00Z", periodEnd: "2026-12-01T00:00:00Z", paidThrough: "2026-12-01T00:00:00Z", cancelAtPeriodEnd: false, pendingPlanId: null, graceUntil: null, nextAttemptAt: null, retryCount: 0, version: 3 };
export const offerPolicy = { suggestedPlanId: "enterprise" as const, allowedCheckoutPlanIds: [], allowedChangePlanIds: [], contactSales: true, teamAdministration: true };
export const summary: BillingSummary = { planId: "startup", status: "active", workspaceKind: "company", canManage: true, provider: "mock", testMode: true, enabled: true, ...offerPolicy };
export const account: BillingAccount = { plans: [], subscription, checkout: null, checkoutQuotes: [], provider: "mock", testMode: true, occupiedSeats: 2, ...offerPolicy };
export const invoice = (id: string, periodStart = "2026-11-01T00:00:00Z"): BillingInvoice => ({ id, workspaceId: "workspace", subscriptionId: "subscription", planId: "startup", periodStart, periodEnd: "2026-12-01T00:00:00Z", subtotal: 5900, tax: 0, total: 5900, currency: "USD", status: "paid", attempts: 1, testMode: true, paidAt: periodStart, refundedAt: null });
export const result = (overrides: Partial<BillingMutation> = {}): BillingMutation => ({ subscription: { ...subscription, version: 4 }, checkout: null, invoice: null, provider: "mock", testMode: true, ...overrides });
export function fixture(overrides: Partial<BillingPort> = {}): BillingPort {
  return { summary: async () => summary, read: async () => account, invoices: async () => ({ data: [], meta: { limit: 30, provider: "mock", testMode: true } }), execute: async () => result(), ...overrides };
}
export function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

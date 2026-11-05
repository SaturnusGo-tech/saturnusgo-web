import type { BillingCheckout, BillingInvoice, BillingMutation, BillingPlanId, BillingSubscription } from "../../domain/billing";
import { versionedBillingIntent } from "../../domain/billing";
import type { BillingPort } from "../../domain/billing-port";
import { previewBillingPlans as plans, previewBillingPolicy, previewCheckoutQuote } from "./preview-billing-policy";
// Isolated UI-preview data. Live HTTP failures never enter this adapter.
const previews = new Map<string, BillingPort>();
const fail = (code: string, status = 409): never => { throw { code, status, requestId: null }; };
const copy = <T,>(value: T): T => structuredClone(value);
export function createPreviewBillingPort(workspaceKind: "personal" | "company", workspaceId: string): BillingPort {
  if (process.env.NODE_ENV === "production") throw new Error("Billing preview is unavailable in production.");
  const key = `${workspaceKind}:${workspaceId}`; const existing = previews.get(key); if (existing) return existing;
  let subscription: BillingSubscription | null = null; let checkout: BillingCheckout | null = null;
  let kind = workspaceKind;
  let invoices: BillingInvoice[] = []; const receipts = new Map<string, { intent: string; result: BillingMutation }>();
  const check = (id: string, signal?: AbortSignal) => { signal?.throwIfAborted(); if (id !== workspaceId) fail("BILLING_FORBIDDEN", 403); };
  const result = (): BillingMutation => copy({ subscription, checkout, invoice: null, provider: "mock", testMode: true, checkoutMode: "local_test" });
  const planFor = (id: BillingPlanId) => { if (id === "enterprise") return fail("BILLING_CONTACT_SALES"); return plans.find(row => row.id === id) ?? fail("BILLING_PLAN_INCOMPATIBLE"); };
  const policy = () => previewBillingPolicy(kind, subscription);
  const port: BillingPort = {
    summary: async (id, signal) => { check(id, signal); return { planId: subscription?.planId ?? null,
      status: subscription?.status ?? (kind === "company" ? "legacy" : "unsubscribed"), workspaceKind: kind, canManage: true, provider: "mock", testMode: true, enabled: true, checkoutMode: "local_test", ...policy() }; },
    read: async (id, signal) => { check(id, signal); return copy({ plans, subscription, checkout: checkout?.status === "open" && Date.parse(checkout.expiresAt) > Date.now() ? checkout : null, provider: "mock", testMode: true, enabled: true, checkoutMode: "local_test", occupiedSeats: 1, ...policy(),
      checkoutQuotes: policy().allowedCheckoutPlanIds.map(id => previewCheckoutQuote(planFor(id), subscription)) }); },
    invoices: async (id, options = {}, signal) => { check(id, signal); const limit = options.limit ?? 30; return copy({ data: invoices.filter(row => !options.before || row.periodStart < options.before || (row.periodStart === options.before && Boolean(options.beforeId) && row.id < options.beforeId!)).sort((left, right) => right.periodStart.localeCompare(left.periodStart) || right.id.localeCompare(left.id)).slice(0, limit), meta: { limit, provider: "mock", testMode: true } }); },
    execute: async (id, intent, options) => {
      check(id, options.signal); const encoded = JSON.stringify(intent); const receipt = receipts.get(options.idempotencyKey);
      if (receipt) { if (receipt.intent !== encoded) fail("BILLING_CONFLICT"); return copy(receipt.result); }
      if (versionedBillingIntent(intent) && (!subscription || options.version !== subscription.version)) fail("BILLING_VERSION_CONFLICT", 412);
      let invoice: BillingInvoice | null = null;
      switch (intent.kind) {
        case "checkout": {
          const plan = planFor(intent.planId);
          if (!policy().allowedCheckoutPlanIds.some(id => id === intent.planId)) fail("BILLING_INVALID_STATE");
          if (checkout?.status === "open" && Date.parse(checkout.expiresAt) > Date.now()) fail("BILLING_CONFLICT");
          const now = new Date(); const quote = previewCheckoutQuote(plan, subscription);
          checkout = { id: crypto.randomUUID(), workspaceId, ...quote, provider: "mock", testMode: true, status: "open", createdAt: now.toISOString(), expiresAt: new Date(Math.min(now.getTime() + 1800000, quote.periodEnd ? Date.parse(quote.periodEnd) : Infinity)).toISOString() }; break;
        }
        case "confirm": {
          if (!checkout || checkout.id !== intent.checkoutId || checkout.status !== "open") fail("BILLING_INVALID_STATE");
          if (Date.parse(checkout!.expiresAt) <= Date.now()) { checkout!.status = "expired"; fail("BILLING_CHECKOUT_EXPIRED", 410); }
          checkout = { ...checkout!, status: intent.outcome === "success" ? "completed" : "failed" };
          if (intent.outcome === "declined") break;
          const plan = planFor(checkout.planId); const start = new Date(); const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1, 1); end.setUTCDate(Math.min(start.getUTCDate(), new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()));
          const previous = subscription;
          subscription = { id: previous?.id ?? crypto.randomUUID(), workspaceId, provider: "mock", testMode: true, planId: plan.id, status: "active", seats: plan.seats, amount: plan.amount, currency: "USD", periodStart: checkout.prorated && previous ? previous.periodStart : start.toISOString(), periodEnd: checkout.periodEnd ?? end.toISOString(), paidThrough: checkout.periodEnd ?? end.toISOString(), cancelAtPeriodEnd: false, pendingPlanId: null, graceUntil: null, nextAttemptAt: null, retryCount: 0, version: (previous?.version ?? 0) + 1 };
          if (plan.id === "startup") kind = "company";
          invoice = { id: crypto.randomUUID(), workspaceId, subscriptionId: subscription.id, planId: plan.id, periodStart: start.toISOString(), periodEnd: subscription.periodEnd, subtotal: checkout.subtotal, tax: 0, total: checkout.subtotal, currency: "USD", status: "paid", attempts: 1, testMode: true, paidAt: start.toISOString(), refundedAt: null };
          invoices = [invoice, ...invoices]; break;
        }
        case "plan": planFor(intent.planId); if (!policy().allowedChangePlanIds.some(id => id === intent.planId)) fail("BILLING_INVALID_STATE"); subscription = { ...subscription!, pendingPlanId: intent.planId, version: subscription!.version + 1 }; break;
        case "cancel": subscription = { ...subscription!, cancelAtPeriodEnd: true, pendingPlanId: null, version: subscription!.version + 1 }; break;
        case "resume": if (subscription!.status !== "active") fail("BILLING_INVALID_STATE"); subscription = { ...subscription!, cancelAtPeriodEnd: false, version: subscription!.version + 1 }; break;
        case "retry": fail("BILLING_INVALID_STATE");
        case "mockOutcome": break;
      }
      const response = { ...result(), invoice }; receipts.set(options.idempotencyKey, { intent: encoded, result: copy(response) }); return response;
    },
  };
  previews.set(key, port); return port;
}

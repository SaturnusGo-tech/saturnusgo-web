import type { BillingPlan, BillingSubscription } from "../../domain/billing";

export const previewBillingPlans: BillingPlan[] = [
  { id: "individual", version: 1, currency: "USD", interval: "month", amount: 1100, seats: 1, workspaceKind: "personal", taxInclusive: false },
  { id: "startup", version: 1, currency: "USD", interval: "month", amount: 5900, seats: 5, workspaceKind: "company", taxInclusive: false },
];
export function previewBillingPolicy(kind: "personal" | "company", sub: BillingSubscription | null) {
  const active = sub && sub.status !== "canceled" ? sub : null;
  const allowedCheckoutPlanIds: ("individual" | "startup")[] = active?.status === "past_due" || active?.cancelAtPeriodEnd ? []
    : active?.planId === "individual" ? ["startup"] : !active && kind === "personal" ? ["individual", "startup"] : [];
  const allowedChangePlanIds: "startup"[] = active?.planId === "enterprise" && active.status === "active" && !active.cancelAtPeriodEnd ? ["startup"] : [];
  return { suggestedPlanId: active?.status === "past_due" ? null : active?.planId === "individual" ? "startup" as const
    : !active && kind === "personal" ? "individual" as const : "enterprise" as const,
    allowedCheckoutPlanIds, allowedChangePlanIds, contactSales: kind === "company", teamAdministration: kind === "company" };
}
export function previewCheckoutQuote(plan: BillingPlan, sub: BillingSubscription | null) {
  const prorated = sub?.planId === "individual" && sub.status === "active" && plan.id === "startup";
  const now = Date.now();
  const subtotal = prorated ? Math.max(0, Math.min(4800, Math.ceil((5900 - 1100) * (Date.parse(sub.paidThrough) - now)
    / (Date.parse(sub.periodEnd) - Date.parse(sub.periodStart))))) : plan.amount;
  return { planId: plan.id, subtotal, currency: "USD" as const, periodEnd: prorated ? sub.paidThrough : null, prorated };
}

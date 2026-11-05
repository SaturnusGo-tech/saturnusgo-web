import type { BillingPlan } from "../billing";

/** Explanatory public pricing; this catalog establishes no account, entitlement or checkout. */
export const publicBillingCatalog: readonly BillingPlan[] = Object.freeze([
  Object.freeze({ id: "individual", version: 1, currency: "USD", interval: "month", amount: 1100, seats: 1, workspaceKind: "personal", taxInclusive: false } as const),
  Object.freeze({ id: "startup", version: 1, currency: "USD", interval: "month", amount: 5900, seats: 5, workspaceKind: "company", taxInclusive: false } as const),
]);

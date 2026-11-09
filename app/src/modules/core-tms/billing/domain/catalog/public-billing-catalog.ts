import type { BillingPlan } from "../billing";

/** Explanatory public pricing; this catalog establishes no account, entitlement or checkout. */
export const publicBillingCatalog: readonly BillingPlan[] = Object.freeze([
  Object.freeze({ id: "individual", version: 1, currency: "USD", interval: "month", amount: 1599, seats: 1, workspaceKind: "personal", taxInclusive: false } as const),
  Object.freeze({ id: "startup", version: 1, currency: "USD", interval: "month", amount: 7999, seats: 5, workspaceKind: "company", taxInclusive: false } as const),
]);

/** Indicative only. Enterprise pricing is agreed directly with the customer. */
export const enterprisePriceExample = Object.freeze({ currency: "USD", interval: "month", amount: 39999, seats: 25 } as const);

export function formatBillingAmount(amount: number, currency: string, locale: "en" | "ru") {
  return new Intl.NumberFormat(locale, {
    style: "currency", currency, maximumFractionDigits: amount % 100 ? 2 : 0,
  }).format(amount / 100);
}

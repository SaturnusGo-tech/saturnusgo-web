import assert from "node:assert/strict";
import { test } from "node:test";
import { enterprisePriceExample, formatBillingAmount, publicBillingCatalog } from "../../domain/catalog/public-billing-catalog";
import { billingPaymentsAvailable } from "../../domain/catalog/billing-availability";

test("the disabled release exposes updated public self-serve prices and a separate Enterprise quote example", () => {
  assert.equal(billingPaymentsAvailable, false);
  assert.deepEqual(publicBillingCatalog.map(({ id, amount, seats, currency, interval, taxInclusive }) => ({ id, amount, seats, currency, interval, taxInclusive })), [
    { id: "individual", amount: 1599, seats: 1, currency: "USD", interval: "month", taxInclusive: false },
    { id: "startup", amount: 7999, seats: 5, currency: "USD", interval: "month", taxInclusive: false },
  ]);
  assert.deepEqual(enterprisePriceExample, { currency: "USD", interval: "month", amount: 39999, seats: 25 });
  assert.deepEqual(publicBillingCatalog.map(plan => formatBillingAmount(plan.amount, plan.currency, "en")), ["$15.99", "$79.99"]);
  assert.equal(formatBillingAmount(enterprisePriceExample.amount, enterprisePriceExample.currency, "ru"), "399,99\u00a0$");
  assert.ok(Object.isFrozen(publicBillingCatalog));
  assert.ok(publicBillingCatalog.every(Object.isFrozen));
});

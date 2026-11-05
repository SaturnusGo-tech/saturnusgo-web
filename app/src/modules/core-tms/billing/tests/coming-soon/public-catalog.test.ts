import assert from "node:assert/strict";
import { test } from "node:test";
import { publicBillingCatalog } from "../../domain/catalog/public-billing-catalog";
import { billingPaymentsAvailable } from "../../domain/catalog/billing-availability";

test("the disabled release exposes only reviewed public self-serve prices and no Enterprise price", () => {
  assert.equal(billingPaymentsAvailable, false);
  assert.deepEqual(publicBillingCatalog.map(({ id, amount, seats, currency, interval, taxInclusive }) => ({ id, amount, seats, currency, interval, taxInclusive })), [
    { id: "individual", amount: 1100, seats: 1, currency: "USD", interval: "month", taxInclusive: false },
    { id: "startup", amount: 5900, seats: 5, currency: "USD", interval: "month", taxInclusive: false },
  ]);
  assert.ok(Object.isFrozen(publicBillingCatalog));
  assert.ok(publicBillingCatalog.every(Object.isFrozen));
});

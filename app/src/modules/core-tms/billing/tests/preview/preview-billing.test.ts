import assert from "node:assert/strict";
import { test } from "node:test";
import { createPreviewBillingPort } from "../../data/preview/preview-billing";
void test("legacy companies keep their seats without self-serve Enterprise checkout", async () => {
  const id = "preview-legacy"; const port = createPreviewBillingPort("company", id);
  const summary = await port.summary(id);
  assert.equal(summary.status, "legacy"); assert.equal(summary.teamAdministration, true);
  assert.deepEqual(summary.allowedCheckoutPlanIds, []); assert.equal(summary.contactSales, true);
  await assert.rejects(port.execute(id, { kind: "checkout", planId: "enterprise" }, { idempotencyKey: "checkout" }), { code: "BILLING_CONTACT_SALES" });
  assert.equal((await port.read(id)).subscription, null);
});
void test("declined Startup purchase never grants team administration", async () => {
  const id = "preview-decline"; const port = createPreviewBillingPort("personal", id);
  const checkout = await port.execute(id, { kind: "checkout", planId: "startup" }, { idempotencyKey: "checkout" });
  assert.equal((await port.summary(id)).teamAdministration, false);
  await port.execute(id, { kind: "confirm", checkoutId: checkout.checkout!.id, outcome: "declined" }, { idempotencyKey: "decline" });
  assert.equal((await port.read(id)).subscription, null); assert.equal((await port.summary(id)).workspaceKind, "personal");
  assert.equal((await port.summary(id)).teamAdministration, false); assert.equal((await port.invoices(id)).data.length, 0);
});
void test("direct Startup purchase promotes the same workspace once and retains receipts", async () => {
  const id = "preview-direct-startup"; const port = createPreviewBillingPort("personal", id);
  assert.deepEqual((await port.summary(id)).allowedCheckoutPlanIds, ["individual", "startup"]);
  const checkout = await port.execute(id, { kind: "checkout", planId: "startup" }, { idempotencyKey: "checkout" });
  const intent = { kind: "confirm" as const, checkoutId: checkout.checkout!.id, outcome: "success" as const };
  const paid = await port.execute(id, intent, { idempotencyKey: "paid" });
  assert.equal(paid.subscription?.workspaceId, id); assert.equal(paid.subscription?.seats, 5);
  const summary = await port.summary(id); assert.equal(summary.teamAdministration, true); assert.equal(summary.workspaceKind, "company");
  assert.equal(summary.suggestedPlanId, "enterprise");
  assert.deepEqual(await port.execute(id, intent, { idempotencyKey: "paid" }), paid);
  assert.equal((await port.invoices(id)).data.length, 1);
});
void test("Individual upgrade preserves subscription and invoices; cancellation keeps paid team access", async () => {
  const id = "preview-upgrade"; const port = createPreviewBillingPort("personal", id);
  const checkout = await port.execute(id, { kind: "checkout", planId: "individual" }, { idempotencyKey: "one" });
  const initial = await port.execute(id, { kind: "confirm", checkoutId: checkout.checkout!.id, outcome: "success" }, { idempotencyKey: "pay-one" });
  assert.equal((await port.summary(id)).suggestedPlanId, "startup");
  const upgrade = await port.execute(id, { kind: "checkout", planId: "startup" }, { idempotencyKey: "two" });
  assert.equal((await port.summary(id)).teamAdministration, false);
  const paid = await port.execute(id, { kind: "confirm", checkoutId: upgrade.checkout!.id, outcome: "success" }, { idempotencyKey: "pay-two" });
  assert.equal(paid.subscription?.id, initial.subscription?.id); assert.equal((await port.invoices(id)).data.length, 2);
  await port.execute(id, { kind: "cancel" }, { idempotencyKey: "cancel", version: paid.subscription!.version });
  assert.equal((await port.summary(id)).teamAdministration, true);
});

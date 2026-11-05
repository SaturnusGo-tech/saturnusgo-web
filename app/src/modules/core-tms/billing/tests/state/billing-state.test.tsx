import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useBilling } from "../../application/useBilling";
import type { BillingAccount, BillingMutation } from "../../domain/billing";
import type { BillingCommandOptions, BillingPort } from "../../domain/billing-port";
import { account, deferred, fixture, invoice, result, subscription } from "../fixtures/billing-fixtures";
let current: ReturnType<typeof useBilling>;
function Probe({ port, workspaceId = "workspace", canManage = true }: { port: BillingPort; workspaceId?: string; canManage?: boolean }) {
  current = useBilling({ port, workspaceId, canManage, workspaceKind: "company" }); return null;
}
async function mount(port = fixture(), canManage = true) { let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={port} canManage={canManage} />); }); return view; }
void test("billing does not read financial data or send commands for ordinary members", async () => {
  let financial = 0; const view = await mount(fixture({ read: async () => { financial++; return account; }, invoices: async () => { financial++; throw new Error(); }, execute: async () => { financial++; return result(); } }), false);
  await act(async () => { await current.cancel(); await current.startCheckout("enterprise"); });
  assert.equal(current.summary?.planId, "startup"); assert.equal(financial, 0);
  await act(async () => view.unmount());
});
void test("an uncertain command is single-flight and explicit retry reuses its exact key and version", async () => {
  const first = deferred<BillingMutation>(); const options: BillingCommandOptions[] = [];
  const view = await mount(fixture({ execute: async (_workspace, _intent, input) => { options.push(input); return options.length === 1 ? first.promise : result(); } }));
  let command!: Promise<void>; await act(async () => { command = current.cancel(); void current.cancel(); });
  assert.equal(options.length, 1); assert.equal(current.busy, true);
  await act(async () => { first.reject(new TypeError("Network interrupted")); await command; });
  assert.equal(current.canRetryCommand, true);
  await act(async () => { await current.resume(); }); assert.equal(options.length, 1);
  await act(async () => { await current.retryCommand(); });
  assert.equal(options.length, 2); assert.equal(options[0]?.idempotencyKey, options[1]?.idempotencyKey);
  assert.equal(options[0]?.version, 3); assert.equal(options[1]?.version, 3); assert.equal(current.canRetryCommand, false);
  await act(async () => view.unmount());
});
void test("version conflict refreshes the current account and requires a fresh explicit command", async () => {
  let reads = 0; const options: BillingCommandOptions[] = [];
  const view = await mount(fixture({ read: async () => ({ ...account, subscription: { ...subscription, version: ++reads === 1 ? 3 : 8 } }), execute: async (_workspace, _intent, input) => { options.push(input); if (options.length === 1) throw { status: 412, code: "BILLING_VERSION_CONFLICT", requestId: "conflict" }; return result(); } }));
  await act(async () => { await current.cancel(); });
  assert.equal(options.length, 1); assert.equal(current.account?.subscription?.version, 8); assert.equal(current.canRetryCommand, false);
  assert.equal(current.error?.code, "BILLING_VERSION_CONFLICT");
  await act(async () => { await current.cancel(); }); assert.equal(options[1]?.version, 8); assert.notEqual(options[0]?.idempotencyKey, options[1]?.idempotencyKey);
  await act(async () => view.unmount());
});
void test("workspace switches immediately hide old billing and ignore late responses from an aborted read", async () => {
  const late = deferred<BillingAccount>(); let signal: AbortSignal | undefined;
  const port = fixture({ read: async (id, input) => { if (id === "workspace") { signal = input; return late.promise; } return { ...account, subscription: { ...subscription, workspaceId: id, planId: "enterprise" } }; } });
  const view = await mount(port); await act(async () => { view.update(<Probe port={port} workspaceId="other" />); });
  assert.equal(signal?.aborted, true); assert.equal(current.account?.subscription?.planId, "enterprise");
  await act(async () => { late.resolve(account); }); assert.equal(current.account?.subscription?.workspaceId, "other");
  await act(async () => view.unmount());
});
void test("checkout stays open across summary refresh and confirmation reflects the server decline", async () => {
  const intents: string[] = [];
  const checkout = { id: "checkout", workspaceId: "workspace", planId: "startup" as const, provider: "mock" as const, testMode: true as const, status: "open" as const, createdAt: "2026-11-05T00:00:00Z", expiresAt: "2026-11-05T00:30:00Z", subtotal: 5900, currency: "USD" as const, periodEnd: null, prorated: false };
  const view = await mount(fixture({ read: async () => ({ ...account, allowedCheckoutPlanIds: ["startup"], subscription: null, plans: [{ id: "startup", version: 1, currency: "USD", interval: "month", amount: 5900, seats: 5, workspaceKind: "company", taxInclusive: false }] }),
    execute: async (_workspace, intent) => { intents.push(intent.kind); return result({ subscription: null, checkout: { ...checkout, status: intent.kind === "confirm" ? "failed" : "open" } }); } }));
  await act(async () => { await current.startCheckout("startup"); }); assert.equal(current.checkout?.status, "open");
  await act(async () => { await current.confirmCheckout("declined"); });
  assert.deepEqual(intents, ["checkout", "confirm"]); assert.equal(current.checkout?.status, "failed"); assert.equal(current.account?.subscription, null);
  await act(async () => view.unmount());
});
void test("unavailable summary cannot invent a legacy subscription or enable financial commands", async () => {
  let reads = 0; const view = await mount(fixture({ summary: async () => { throw { status: 404, code: "NOT_FOUND" }; }, read: async () => { reads++; return account; } }));
  assert.equal(current.summary, null); assert.equal(current.account, null); assert.equal(current.error?.code, "NOT_FOUND"); assert.equal(reads, 0);
  await act(async () => view.unmount());
});
void test("leaving a workspace aborts an in-flight command and ignores its late subscription and invoice", async () => {
  const pending = deferred<BillingMutation>(); let signal: AbortSignal | undefined;
  const port = fixture({ execute: async (_workspace, _intent, options) => { signal = options.signal; return pending.promise; }, read: async id => ({ ...account, subscription: { ...subscription, workspaceId: id } }) });
  const view = await mount(port); let request!: Promise<void>;
  await act(async () => { request = current.cancel(); });
  await act(async () => { view.update(<Probe port={port} workspaceId="other" />); });
  assert.equal(signal?.aborted, true);
  await act(async () => { pending.resolve(result({ invoice: invoice("old-invoice") })); await request; });
  assert.equal(current.account?.subscription?.workspaceId, "other"); assert.equal(current.invoices.length, 0); assert.equal(current.busy, false);
  await act(async () => view.unmount());
});
void test("invoice pagination is single-flight, deduplicates rows, and preserves history after retryable errors", async () => {
  const next = deferred<{ data: ReturnType<typeof invoice>[]; meta: { limit: number; provider: "mock"; testMode: true } }>();
  const before: (string | undefined)[] = []; const beforeIds: (string | undefined)[] = []; let attempts = 0;
  const port = fixture({ invoices: async (_workspace, options) => { before.push(options?.before); beforeIds.push(options?.beforeId); if (!options?.before) return { data: [invoice("one"), invoice("two", "2026-10-01T00:00:00Z")], meta: { limit: 2, provider: "mock", testMode: true } }; if (++attempts === 1) return next.promise; return { data: [invoice("two", "2026-10-01T00:00:00Z"), invoice("three", "2026-09-01T00:00:00Z")], meta: { limit: 30, provider: "mock", testMode: true } }; } });
  const view = await mount(port); let first!: Promise<void>;
  await act(async () => { first = current.loadMoreInvoices(); void current.loadMoreInvoices(); }); assert.equal(before.length, 2);
  await act(async () => { next.reject(new Error("Disconnected")); await first; });
  assert.equal(current.invoices.length, 2); assert.equal(current.invoicesError?.retryable, true);
  await act(async () => { await current.loadMoreInvoices(); });
  assert.deepEqual(current.invoices.map(row => row.id), ["one", "two", "three"]); assert.equal(before[2], "2026-10-01T00:00:00Z"); assert.equal(beforeIds[2], "two"); assert.equal(current.hasMoreInvoices, false);
  await act(async () => view.unmount());
});
void test("an open checkout recovered from the administrator read can be confirmed after remount", async () => {
  const checkout = { id: "recover-checkout", workspaceId: "workspace", planId: "startup" as const, provider: "mock" as const, testMode: true as const, status: "open" as const, createdAt: "2026-11-05T00:00:00Z", expiresAt: "2026-11-05T00:30:00Z", subtotal: 5900, currency: "USD" as const, periodEnd: null, prorated: false };
  let confirmed: string | null = null;
  const view = await mount(fixture({ read: async () => ({ ...account, checkout: confirmed ? null : checkout, subscription: confirmed ? subscription : null }), execute: async (_id, intent) => { if (intent.kind === "confirm") confirmed = intent.checkoutId; return result({ checkout: { ...checkout, status: "completed" } }); } }));
  assert.equal(current.checkout?.id, "recover-checkout");
  await act(async () => { await current.confirmCheckout("success"); });
  assert.equal(confirmed, "recover-checkout"); assert.equal(current.checkout?.status, "completed");
  await act(async () => view.unmount());
});
void test("an expired recovered checkout refreshes read state instead of leaving a confirmation action open", async () => {
  let reads = 0;
  const checkout = { id: "expired", workspaceId: "workspace", planId: "startup" as const, provider: "mock" as const, testMode: true as const, status: "open" as const, createdAt: "2026-11-05T00:00:00Z", expiresAt: "2026-11-05T00:30:00Z", subtotal: 5900, currency: "USD" as const, periodEnd: null, prorated: false };
  const view = await mount(fixture({ read: async () => ({ ...account, subscription: null, checkout: ++reads === 1 ? checkout : null }), execute: async () => { throw { status: 410, code: "BILLING_CHECKOUT_EXPIRED" }; } }));
  await act(async () => { await current.confirmCheckout("success"); });
  assert.equal(current.checkout, null); assert.equal(current.error?.code, "BILLING_CHECKOUT_EXPIRED"); assert.equal(current.canRetryCommand, false);
  await act(async () => view.unmount());
});
void test("a fresh read clearing an expired checkout supersedes a previous successful checkout response", async () => {
  const checkout = { id: "refresh-expired", workspaceId: "workspace", planId: "startup" as const, provider: "mock" as const, testMode: true as const, status: "open" as const, createdAt: "2026-11-05T00:00:00Z", expiresAt: "2026-11-05T00:30:00Z", subtotal: 5900, currency: "USD" as const, periodEnd: null, prorated: false };
  const view = await mount(fixture({ read: async () => ({ ...account, allowedCheckoutPlanIds: ["startup"], checkout: null, subscription: null, plans: [{ id: "startup", version: 1, currency: "USD", interval: "month", amount: 5900, seats: 5, workspaceKind: "company", taxInclusive: false }] }), execute: async () => result({ subscription: null, checkout }) }));
  await act(async () => { await current.startCheckout("startup"); }); assert.equal(current.checkout?.status, "open");
  await act(async () => { current.reload(); }); assert.equal(current.checkout, null);
  await act(async () => view.unmount());
});
void test("an exact receipt replay cannot overwrite a newer subscription loaded during network recovery", async () => {
  let reads = 0; let writes = 0;
  const view = await mount(fixture({ read: async () => ({ ...account, subscription: { ...subscription, version: ++reads === 1 ? 3 : 8 } }), execute: async () => { if (++writes === 1) throw new TypeError("Response lost"); return result({ subscription: { ...subscription, version: 4 } }); } }));
  await act(async () => { await current.cancel(); });
  await act(async () => { current.reload(); }); assert.equal(current.account?.subscription?.version, 8);
  await act(async () => { await current.retryCommand(); }); assert.equal(current.account?.subscription?.version, 8);
  await act(async () => view.unmount());
});

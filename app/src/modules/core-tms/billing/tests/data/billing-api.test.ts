import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient, TmsMutationOptions } from "../../../../../core/tms/transport/http";
import { createBillingApi } from "../../data/http/billing-api";

void test("billing requests use the shared authenticated transport, encoded scope and opaque server versions", async () => {
  const reads: string[] = []; const mutations: { path: string; body: unknown; options?: TmsMutationOptions }[] = [];
  const client: TmsHttpClient = {
    get: async path => { reads.push(path); return { data: [], meta: { limit: 30, provider: "mock", testMode: true } } as never; },
    getResource: async path => { reads.push(path); return { data: { enabled: true } as never, etag: '"7"' }; },
    mutate: async () => { throw new Error("resource transport required"); },
    mutateResource: async (path, _method, body, options) => {
      mutations.push({ path, body, options }); return { data: { subscription: null, checkout: null, invoice: null, provider: "mock", testMode: true } as never, etag: null };
    },
  };
  const api = createBillingApi(client); const controller = new AbortController();
  await api.summary("company:a b", controller.signal); await api.read("company:a b", controller.signal);
  await api.invoices("company:a b", { before: "2026-11-01T00:00:00Z", beforeId: "invoice:2" }, controller.signal);
  await api.execute("workspace", { kind: "plan", planId: "startup" }, { idempotencyKey: "command-1", version: 7, signal: controller.signal });
  await api.execute("workspace", { kind: "confirm", checkoutId: "checkout-1", outcome: "declined" }, { idempotencyKey: "command-2", signal: controller.signal });
  assert.deepEqual(reads, ["/billing/summary?workspaceId=company%3Aa+b", "/billing?workspaceId=company%3Aa+b", "/billing/invoices?workspaceId=company%3Aa+b&limit=30&before=2026-11-01T00%3A00%3A00Z&beforeId=invoice%3A2"]);
  assert.deepEqual(mutations.map(({ path, body }) => ({ path, body })), [
    { path: "/billing/subscription", body: { workspaceId: "workspace", kind: "plan", planId: "startup" } },
    { path: "/billing/confirm", body: { workspaceId: "workspace", checkoutId: "checkout-1", outcome: "declined" } },
  ]);
  assert.equal(mutations[0]?.options?.ifMatch, '"7"'); assert.equal(mutations[0]?.options?.idempotencyKey, "command-1");
  assert.equal(mutations[0]?.options?.signal, controller.signal); assert.equal(mutations[1]?.options?.ifMatch, undefined);
});

void test("versioned billing commands fail locally without a known version", async () => {
  let called = false;
  const client = { mutateResource: async () => { called = true; } } as unknown as TmsHttpClient;
  await assert.rejects(createBillingApi(client).execute("workspace", { kind: "retry" }, { idempotencyKey: "key" }), /version/i);
  assert.equal(called, false);
});

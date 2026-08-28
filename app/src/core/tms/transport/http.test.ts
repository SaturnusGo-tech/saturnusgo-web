import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient, TmsApiError } from "./http";

test("adds bearer authorization to reads and mutations without ambient credentials", async () => {
  const calls: RequestInit[] = [];
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    accessToken: async () => "header.payload.signature",
    fetch: (async (_resource, init = {}) => {
      calls.push(init);
      return new Response(JSON.stringify({ data: { id: "result" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });
  await client.get("/bootstrap");
  assert.deepEqual(await client.mutate("/projects", "POST", { name: "TMS" }), { id: "result" });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(new Headers(call.headers).get("authorization"), "Bearer header.payload.signature");
    assert.equal(call.credentials, "omit");
    assert.equal(call.redirect, "error");
    assert.equal(call.cache, "no-store");
  }
});

test("preserves cancellation and never starts an unauthorized request", async () => {
  const controller = new AbortController();
  const reason = new DOMException("Navigation cancelled", "AbortError");
  controller.abort(reason);
  let fetchCalled = false;
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    accessToken: async (signal) => { signal?.throwIfAborted(); return "unused"; },
    fetch: (async () => { fetchCalled = true; throw new Error("unexpected"); }) as typeof fetch,
  });
  await assert.rejects(() => client.get("/bootstrap", controller.signal), (error) => error === reason);
  assert.equal(fetchCalled, false);
});

test("classifies token failures without exposing provider errors", async () => {
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    accessToken: async () => { throw new Error("raw Auth0 details"); },
    fetch: (async () => { throw new Error("unexpected"); }) as typeof fetch,
  });
  await assert.rejects(() => client.get("/bootstrap"), (error: unknown) => {
    assert.ok(error instanceof TmsApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message.includes("raw Auth0 details"), false);
    return true;
  });
});

test("preserves strong ETags and sends explicit concurrency and idempotency headers", async () => {
  const calls: RequestInit[] = [];
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    accessToken: async () => "token",
    fetch: (async (_resource, init = {}) => {
      calls.push(init);
      return new Response(JSON.stringify({ data: { id: "case-1" } }), {
        status: 200,
        headers: { etag: '"case-1:7"' },
      });
    }) as typeof fetch,
  });
  const read = await client.getResource<{ id: string }>("/test-cases/case-1");
  const changed = await client.mutateResource<{ id: string }>(
    "/test-cases/case-1",
    "PATCH",
    { title: "Updated" },
    { ifMatch: read.etag!, idempotencyKey: "operation-123456" },
  );
  assert.equal(changed.etag, '"case-1:7"');
  const headers = new Headers(calls[1]?.headers);
  assert.equal(headers.get("if-match"), '"case-1:7"');
  assert.equal(headers.get("idempotency-key"), "operation-123456");
});

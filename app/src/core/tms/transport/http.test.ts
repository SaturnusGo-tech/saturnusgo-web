import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTmsMutationFailure,
  toTmsMutationFailure,
} from "../errors/mutation-failure";
import { resolvePendingOperation } from "../idempotency/pending-operation";
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

test("uses the HttpOnly cloud session without adding an authorization header", async () => {
  let request: RequestInit | undefined;
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    credentials: "include",
    fetch: (async (_resource, init = {}) => {
      request = init;
      return new Response(JSON.stringify({ data: { id: "cloud-result" } }), { status: 200 });
    }) as typeof fetch,
  });
  assert.deepEqual(await client.get("/bootstrap"), { data: { id: "cloud-result" } });
  assert.equal(request?.credentials, "include");
  assert.equal(new Headers(request?.headers).has("authorization"), false);
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

test("normalizes an edge-weakened resource ETag before sending If-Match", async () => {
  const calls: RequestInit[] = [];
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    accessToken: async () => "token",
    fetch: (async (_resource, init = {}) => {
      calls.push(init);
      return new Response(JSON.stringify({ data: { id: "item-1" } }), {
        status: 200,
        headers: { etag: 'W/"run-item:item-1:1"' },
      });
    }) as typeof fetch,
  });
  const read = await client.getResource<{ id: string }>("/runs/run-1/items/item-1");
  assert.equal(read.etag, '"run-item:item-1:1"');
  await client.mutateResource("/runs/run-1/items/item-1/status", "PATCH", {
    status: "passed",
  }, { ifMatch: read.etag!, idempotencyKey: "operation-weak-etag-1" });
  assert.equal(new Headers(calls[1]?.headers).get("if-match"), '"run-item:item-1:1"');
});

test("preserves the documented API error code, message, and request ID", async () => {
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    accessToken: async () => "token",
    fetch: (async () => new Response(JSON.stringify({
      error: {
        code: "CONFLICT",
        message: "Project key already exists.",
        requestId: "request-conflict-1",
      },
    }), {
      status: 409,
      headers: { "content-type": "application/json", "x-request-id": "request-conflict-1" },
    })) as typeof fetch,
  });

  await assert.rejects(() => client.mutate("/projects", "POST", {}), (error: unknown) => {
    assert.ok(error instanceof TmsApiError);
    assert.equal(error.status, 409);
    assert.equal(error.code, "CONFLICT");
    assert.equal(error.requestId, "request-conflict-1");
    assert.equal(error.message, "Project key already exists.");
    assert.equal(
      formatTmsMutationFailure(toTmsMutationFailure(error), "Could not create project."),
      "Project key already exists. [CONFLICT · requestId=request-conflict-1]",
    );
    return true;
  });
});

test("uses bounded fallback diagnostics for malformed failure responses", async () => {
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    production: true,
    accessToken: async () => "token",
    fetch: (async () => new Response("upstream failed", {
      status: 502,
      headers: { "x-request-id": "request-gateway-1" },
    })) as typeof fetch,
  });

  await assert.rejects(() => client.get("/runs"), (error: unknown) => {
    assert.ok(error instanceof TmsApiError);
    assert.equal(error.code, "HTTP_ERROR");
    assert.equal(error.requestId, "request-gateway-1");
    assert.equal(error.message, "TMS API returned 502");
    return true;
  });
});

test("reuses one idempotency key only while the operation payload is unchanged", () => {
  let sequence = 0;
  const createKey = () => `operation-${++sequence}`;
  const first = resolvePendingOperation(null, "payload-a", createKey);
  const retry = resolvePendingOperation(first, "payload-a", createKey);
  const changed = resolvePendingOperation(retry, "payload-b", createKey);

  assert.equal(retry.key, first.key);
  assert.equal(changed.key, "operation-2");
});

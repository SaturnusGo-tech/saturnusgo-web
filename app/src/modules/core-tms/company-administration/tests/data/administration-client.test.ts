import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdministrationClient } from "../../data/administration-client";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { AdministrationError } from "../../domain/administration";

void test("avatar mutations preserve concurrency, idempotency, cancellation and private same-origin transport", async () => {
  const requests: { url: string; init: RequestInit }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://alpha-falcon.example.test/api/v1", credentials: "include", production: true,
    fetch: async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ data: { version: 2 } }), { status: 200, headers: { etag: '"2"', "content-type": "application/json" } });
    } });
  const client = createAdministrationClient(http);
  const signal = new AbortController().signal;
  const image = new Blob([new Uint8Array(32)], { type: "image/png" });
  await client.uploadAvatar("person:one", 1, image, "stable-avatar-upload-key", signal);
  assert.equal(requests[0].url, "https://alpha-falcon.example.test/api/v1/company/members/person%3Aone/avatar");
  assert.equal(requests[0].init.credentials, "include");
  assert.equal(requests[0].init.cache, "no-store");
  const headers = new Headers(requests[0].init.headers);
  assert.equal(headers.get("if-match"), '"1"'); assert.equal(headers.get("idempotency-key"), "stable-avatar-upload-key");
  const body = JSON.parse(String(requests[0].init.body));
  assert.deepEqual(Object.keys(body), ["imageBase64"]); assert.equal(Buffer.from(body.imageBase64, "base64").length, 32);
  await client.removeAvatar(null, 2, signal);
  assert.equal(requests[1].url, "https://alpha-falcon.example.test/api/v1/profile/avatar");
  assert.equal(requests[1].init.method, "DELETE"); assert.equal(new Headers(requests[1].init.headers).get("if-match"), '"2"');
  const controller = new AbortController(); controller.abort();
  await assert.rejects(client.uploadAvatar(null, 1, image, "aborted-avatar-upload", controller.signal), { name: "AbortError" });
  assert.equal(requests.length, 2);
  await assert.rejects(client.uploadAvatar(null, 1, new Blob(["<svg>bad</svg>"], { type: "image/svg+xml" }), "unsafe-avatar-file", signal), { code: "INVALID_AVATAR" });
  assert.equal(requests.length, 2);
});

void test("tenant journal never accepts a client company override and auth failures remain actionable", async () => {
  const urls: string[] = [];
  const http = createTmsHttpClient({ apiBase: "https://alpha-falcon.example.test/api/v1", credentials: "include", production: true,
    fetch: async (url) => { urls.push(String(url)); return new Response(JSON.stringify({ error: { code: "SESSION_REQUIRED", requestId: "test-request-001" } }), { status: 401 }); } });
  const client = createAdministrationClient(http);
  await assert.rejects(client.journal(false, "foreign-workspace", "last-event", new AbortController().signal), (error: unknown) => {
    assert.ok(error instanceof AdministrationError); assert.equal(error.code, "SESSION_REQUIRED"); assert.equal(error.requestId, "test-request-001"); return true;
  });
  assert.ok(urls[0].includes("/company/audit?limit=30&cursor=last-event"));
  assert.ok(!urls[0].includes("foreign-workspace"));
});

void test("session confirmation sends credentials only in a private POST body and preserves reauthentication errors", async () => {
  let captured: { url: string; init: RequestInit } | undefined;
  const http = createTmsHttpClient({ apiBase: "https://sandbox-falcon.example.test/api/v1", credentials: "include", production: true,
    fetch: async (url, init) => { captured = { url: String(url), init: init ?? {} };
      return new Response(JSON.stringify({ error: { code: "REAUTHENTICATION_REQUIRED", requestId: "confirm-1" } }), { status: 403 }); } });
  const proof = { currentPassword: "synthetic current password", secondFactor: { kind: "totp" as const, code: "123456" } };
  await assert.rejects(createAdministrationClient(http).reauthenticate(proof, new AbortController().signal), { code: "REAUTHENTICATION_REQUIRED" });
  assert.equal(captured?.url, "https://sandbox-falcon.example.test/api/v1/profile/reauthenticate");
  assert.equal(captured?.init.method, "POST");
  assert.equal(captured?.init.credentials, "include");
  assert.equal(captured?.init.cache, "no-store");
  assert.deepEqual(JSON.parse(String(captured?.init.body)), proof);
  assert.equal(new Headers(captured?.init.headers).has("idempotency-key"), false);
});

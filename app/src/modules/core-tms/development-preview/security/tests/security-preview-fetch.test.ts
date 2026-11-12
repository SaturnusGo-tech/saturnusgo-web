import assert from "node:assert/strict";
import test from "node:test";
import { securityPreviewFetch } from "../network/security-preview-fetch";
import { createSecurityPreviewClient } from "../security-preview-client";

void test("only same-origin GET framework paths reach the actual development server", async () => {
  const forwarded: string[] = [];
  const previous: typeof fetch = async input => { forwarded.push(input instanceof Request ? input.url : String(input)); return new Response("framework"); };
  const send = securityPreviewFetch("http://localhost:4684", createSecurityPreviewClient(false).fetch, previous);
  for (const url of ["/_next/static/chunk.js", "/_next/webpack-hmr", "/work/security-preview/?_rsc=sample", "http://localhost:4684/work/security-preview/index.txt"]) {
    assert.equal(await (await send(url)).text(), "framework");
  }
  assert.equal(forwarded.length, 4);
  const method = new Request("http://localhost:4684/work/security-preview/", { method: "POST", body: "sample" });
  for (const input of ["/api/v1/auth/google/start", "/api/v1/profile/password", "/api/v1/profile/sessions/any/revoke", "/work/", "/", "https://external.invalid/_next/static/chunk.js", "http://localhost:9999/work/security-preview/", method]) {
    assert.equal((await send(input)).status, 403);
  }
  assert.equal((await send("/_next/static/chunk.js", { method: "POST", body: "sample" })).status, 403);
  assert.equal(forwarded.length, 4);
});

void test("auth method reads stay local while aborted framework reads never reach the server", async () => {
  let forwarded = 0;
  const send = securityPreviewFetch("http://localhost:4684", createSecurityPreviewClient(false).fetch, async () => { forwarded++; return new Response(); });
  const response = await send("/api/v1/auth/methods");
  assert.equal((await response.json()).data.google, true); assert.equal(forwarded, 0);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(send("/_next/static/chunk.js", { signal: controller.signal }), { name: "AbortError" });
  assert.equal(forwarded, 0);
});

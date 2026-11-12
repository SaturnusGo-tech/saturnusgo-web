import assert from "node:assert/strict";
import test from "node:test";
import { integrationPreviewFetch } from "../../network/integration-preview-fetch";
import { createIntegrationPreviewClient } from "../../network/integration-preview-client";

test("only same-origin framework GETs reach the development server", async () => {
  const forwarded: string[] = [];
  const previous: typeof fetch = async input => { forwarded.push(input instanceof Request ? input.url : String(input)); return new Response("framework"); };
  const send = integrationPreviewFetch("http://localhost:4684", createIntegrationPreviewClient().fetch, previous);
  for (const input of ["/_next/static/chunk.js", "/_next/webpack-hmr", "/work/integration-preview?provider=confluence&_rsc=sample",
    "/work/integration-preview/", new Request("http://localhost:4684/work/integration-preview/index.txt")]) {
    assert.equal(await (await send(input)).text(), "framework");
  }
  assert.equal(forwarded.length, 5);
  for (const input of ["/api/v1/integrations/connectors", "/api/v1/integrations/youtrack/discovery", "/work/", "/",
    "/work/integration-preview-other", "/work/security-preview/", "https://external.invalid/_next/static/chunk.js",
    "http://localhost:9999/work/integration-preview/", "http://user:password@localhost:4684/work/integration-preview/"]) {
    assert.equal((await send(input)).status, 403, input);
  }
  assert.equal((await send("/_next/static/chunk.js", { method: "POST", body: "sample" })).status, 403);
  assert.equal((await send(new Request("http://localhost:4684/work/integration-preview/", { method: "POST", body: "sample" }))).status, 403);
  assert.equal(forwarded.length, 5);
});

test("aborted framework requests never reach either transport", async () => {
  let called = 0;
  const fallback: typeof fetch = async () => { called++; return new Response(); };
  const send = integrationPreviewFetch("http://localhost:4684", fallback, fallback);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(send("/_next/static/chunk.js", { signal: controller.signal }), { name: "AbortError" });
  await assert.rejects(send(new Request("http://localhost:4684/work/integration-preview/", { signal: controller.signal })), { name: "AbortError" });
  assert.equal(called, 0);
});

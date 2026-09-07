import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { connectorApi } from "../data/connector-api";
import { connectionDraft } from "../model/connector-draft";

test("connection save and disconnect send scope and ETag; credentials stay in the authenticated body", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json({ data: null }, { headers: { etag: '"connector-v2"' } });
    } });
  const api = connectorApi(http); const input = connectionDraft("slack", null);
  input.secrets.apiToken = "local-test-secret";
  const scope = { workspaceId: "workspace-a", projectId: "project-b" };
  await api.save(scope, "slack", input, '"connector-v1"', new AbortController().signal);
  await api.disconnect(scope, "slack", '"connector-v2"', new AbortController().signal);
  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[0]!.url).searchParams.get("projectId"), "project-b");
  assert.equal(calls[0]!.url.includes("local-test-secret"), false);
  assert.equal(new Headers(calls[0]!.init?.headers).get("authorization"), "Bearer header.payload.signature");
  assert.equal(new Headers(calls[0]!.init?.headers).get("if-match"), '"connector-v1"');
  assert.equal(new Headers(calls[1]!.init?.headers).get("if-match"), '"connector-v2"');
  assert.equal(calls[1]!.init?.method, "POST");
  assert.ok(calls[1]!.url.includes("/slack/disconnect?"));
});
test("aborted screen loads do not issue new transport requests", async () => {
  let count = 0; const controller = new AbortController(); controller.abort();
  const api = connectorApi(createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: async () => {
      count += 1; throw new Error("Unexpected request");
    } }));
  await assert.rejects(api.load({ workspaceId: "a", projectId: "b" }, "jira", controller.signal));
  assert.equal(count, 0);
});

test("activity refresh reads current scoped deliveries and links without reloading configuration", async () => {
  const urls: URL[] = [];
  const api = connectorApi(createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "test", fetch: async (input) => {
      const url = new URL(String(input)); urls.push(url);
      return Response.json(url.pathname.endsWith("/deliveries")
        ? { data: [{ id: "delivery-new", status: "delivered" }], nextCursor: "older-page" }
        : { data: [{ remoteKey: "KAN-1" }] });
    } }));
  const result = await api.activity({ workspaceId: "workspace-a", projectId: "project-b" },
    "jira", new AbortController().signal);
  assert.deepEqual(urls.map((url) => url.pathname), [
    "/api/v1/integrations/connectors/jira/deliveries", "/api/v1/integrations/connectors/jira/links",
  ]);
  for (const url of urls) assert.deepEqual(Object.fromEntries(url.searchParams), {
    workspaceId: "workspace-a", projectId: "project-b",
  });
  assert.deepEqual(Object.keys(result).sort(), ["deliveries", "links", "nextCursor"]);
  assert.equal(result.deliveries[0]?.id, "delivery-new");
  assert.equal(result.links[0]?.remoteKey, "KAN-1");
  assert.equal(result.nextCursor, "older-page");
});

test("navigation cancellation rejects a late activity response before it can replace the next scope", async () => {
  const controller = new AbortController();
  let finish: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { finish = resolve; });
  const api = connectorApi(createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "test", fetch: async () => {
      await gate; return Response.json({ data: [], nextCursor: null });
    } }));
  const request = api.activity({ workspaceId: "old-workspace", projectId: "old-project" }, "jira", controller.signal);
  controller.abort(); finish?.();
  await assert.rejects(request);
});

test("republishing a linked report sends an authenticated scoped command with OCC and stable idempotency", async () => {
  const calls: { url: URL; init?: RequestInit }[] = [];
  const api = connectorApi(createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "test", fetch: async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return Response.json({ data: { accepted: true, deliveryId: "delivery-new" } }, { status: 202 });
    } }));
  const scope = { workspaceId: "workspace-a", projectId: "project-b" };
  for (let i = 0; i < 2; i += 1) {
    const result = await api.republishReport(scope, "run_1", '"connection-v2"', "republish-request-123", new AbortController().signal);
    assert.deepEqual(result.data, { accepted: true, deliveryId: "delivery-new" });
  }
  for (const call of calls) {
    assert.equal(call.url.pathname, "/api/v1/integrations/connectors/confluence/reports/run_1/republish");
    assert.deepEqual(Object.fromEntries(call.url.searchParams), scope);
    const headers = new Headers(call.init?.headers);
    assert.equal(headers.get("authorization"), "Bearer test");
    assert.equal(headers.get("if-match"), '"connection-v2"');
    assert.equal(headers.get("idempotency-key"), "republish-request-123");
    assert.equal(headers.get("content-type"), null);
    assert.equal(call.init?.body, undefined);
    assert.equal(call.init?.method, "POST");
  }
});

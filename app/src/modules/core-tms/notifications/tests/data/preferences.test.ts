import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { notificationClient } from "../../data/notification-client";

test("preferences serialize categories and exclusions with workspace scope and the current concurrency version", async () => {
  const requests: Request[] = [];
  const http = createTmsHttpClient({ apiBase: "https://fixture.test/api/v1", accessToken: async () => "fixture-token", fetch: async (url, init) => {
    requests.push(new Request(url, init)); return Response.json({ data: { saved: true } });
  } });
  const client = notificationClient(http, "workspace/a&b"), controller = new AbortController();
  await client.preferences({ categories: ["cases"], locale: "ru", excludedEventTypes: ["test_case.created"] }, 8, controller.signal);
  assert.equal(requests.length, 1); assert.equal(requests[0].method, "PATCH");
  assert.equal(new URL(requests[0].url).searchParams.get("workspaceId"), "workspace/a&b");
  assert.equal(requests[0].headers.get("if-match"), '"notification-v8"');
  assert.deepEqual(await requests[0].json(), { categories: ["cases"], locale: "ru", excludedEventTypes: ["test_case.created"] });
});

test("legacy omission and explicit empty exclusions remain distinct JSON payloads", async () => {
  const payloads: unknown[] = [];
  const http = createTmsHttpClient({ apiBase: "https://fixture.test/api/v1", accessToken: async () => "fixture-token", fetch: async (_url, init) => {
    payloads.push(JSON.parse(String(init?.body))); return Response.json({ data: { saved: true } });
  } });
  const client = notificationClient(http, "w"), signal = new AbortController().signal;
  await client.preferences({ categories: [], locale: "en" }, 0, signal);
  await client.preferences({ categories: [], locale: "en", excludedEventTypes: [] }, 1, signal);
  assert.deepEqual(payloads, [{ categories: [], locale: "en" }, { categories: [], locale: "en", excludedEventTypes: [] }]);
});

test("preference cancellation reaches the actual HTTP request", async () => {
  let requested!: AbortSignal;
  const http = createTmsHttpClient({ apiBase: "https://fixture.test/api/v1", accessToken: async () => "fixture-token",
    fetch: async (_url, init) => new Promise<Response>((_resolve, reject) => {
      requested = init!.signal!; requested.addEventListener("abort", () => reject(requested.reason), { once: true });
    }) });
  const controller = new AbortController();
  const pending = notificationClient(http, "w").preferences({ categories: [], locale: "en", excludedEventTypes: [] }, 3, controller.signal);
  await new Promise(resolve => setTimeout(resolve, 0)); controller.abort();
  await assert.rejects(pending, { name: "AbortError" }); assert.equal(requested.aborted, true);
});

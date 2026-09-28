import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { guideHistoryApi } from "../../history/data/history-api";

test("history adapters use scoped generated endpoints and keep list metadata separate", async () => {
  const calls: { path: string; method: string; body?: unknown; options?: unknown }[] = [];
  const http = {
    get: async (path: string) => { calls.push({ path, method: "GET" }); return { data: [], meta: { nextCursor: "next" } }; },
    mutate: async (path: string, method: string, body: unknown) => { calls.push({ path, method, body }); return { id: "saved" }; },
    mutateResource: async (path: string, method: string, body: unknown, options: unknown) => { calls.push({ path, method, body, options }); return { data: undefined }; },
  } as unknown as TmsHttpClient;
  const api = guideHistoryApi(http, "workspace/private");
  assert.deepEqual(await api.list("run build", null), { items: [], nextCursor: "next" });
  assert.match(calls[0].path, /^\/workspaces\/workspace%2Fprivate\/ai\/documentation-chats\?limit=20&q=run\+build$/);
  await api.turns("chat-id", "older"); assert.match(calls[1].path, /chat-id\/turns\?limit=20&cursor=older$/);
  await api.share("chat-id", "turn-id", { shareId: "requested" });
  assert.deepEqual(calls[2].body, { shareId: "requested" }); assert.match(calls[2].path, /chat-id\/turns\/turn-id\/share$/);
  await api.revoke("chat-id", "share-id");
  assert.equal(calls[3].method, "DELETE"); assert.deepEqual(calls[3].options, { signal: undefined, ifMatch: "*" });
  await api.rename("chat-id", { title: "Updated name", expectedVersion: 7 });
  assert.equal(calls[4].method, "PATCH"); assert.deepEqual(calls[4].options, { signal: undefined, ifMatch: '"7"' });
  assert.deepEqual(calls[4].body, { title: "Updated name", expectedVersion: 7 });
  await api.archive("chat-id", { expectedVersion: 8 });
  assert.equal(calls[5].method, "POST"); assert.match(calls[5].path, /chat-id\/archive$/);
  assert.deepEqual(calls[5].body, { expectedVersion: 8 });
});

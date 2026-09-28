import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { notificationInboxClient } from "../../../data/inbox-client";

const controller = new AbortController();
test("inbox reads retain server pagination and unread totals while encoding workspace, locale and cursor", async () => {
  const calls: { path: string; signal: unknown }[] = [];
  const http = { get: async (path: string, signal: AbortSignal) => {
    calls.push({ path, signal }); return { data: [{ id: "n" }], meta: { nextCursor: "next", unreadCount: 27 } };
  } } as unknown as TmsHttpClient;
  const client = notificationInboxClient(http, "workspace/a&b", "ru");
  const page = await client.list("cursor/+=", controller.signal), query = new URL(calls[0].path, "https://fixture.test").searchParams;
  assert.equal(query.get("workspaceId"), "workspace/a&b"); assert.equal(query.get("locale"), "ru"); assert.equal(query.get("cursor"), "cursor/+=");
  assert.deepEqual(page, { items: [{ id: "n" }], next: "next", unreadCount: 27 }); assert.equal(calls[0].signal, controller.signal);
});

test("read and bulk commands use their own scoped endpoints and forward cancellation", async () => {
  const calls: { path: string; method: string; body: unknown; signal: unknown }[] = [];
  const http = { mutate: async (path: string, method: string, body: unknown, signal: AbortSignal) => { calls.push({ path, method, body, signal }); } } as unknown as TmsHttpClient;
  const client = notificationInboxClient(http, "workspace", "en");
  await client.read("id/escape", controller.signal); await client.readAll(controller.signal); await client.archiveRead(controller.signal);
  assert.deepEqual(calls.map(call => new URL(call.path, "https://fixture.test").pathname), ["/notifications/id%2Fescape/read", "/notifications/read-all", "/notifications/archive-read"]);
  assert.ok(calls.every(call => call.method === "POST" && call.signal === controller.signal && call.body === undefined));
  assert.ok(calls.every(call => new URL(call.path, "https://fixture.test").searchParams.get("workspaceId") === "workspace"));
});

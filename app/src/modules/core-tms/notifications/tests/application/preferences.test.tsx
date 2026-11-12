import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import type { NotificationClient } from "../../domain/notifications";
import { fixture, mount, snapshot } from "./support/harness";

test("changing categories preserves previously excluded events and saves the current version", async t => {
  const f = fixture(), h = await mount(f.client); t.after(h.unmount);
  await act(async () => { await h.state().changeCategories(["cases"]); });
  assert.deepEqual(f.writes[0].value, { categories: ["cases"], excludedEventTypes: ["test_case.created"], locale: "en" });
  assert.equal(f.writes[0].version, 4);
  assert.deepEqual(h.state().settings?.categories, ["cases"]);
  assert.equal(h.state().settings?.version, 5);
});

test("changing event exclusions preserves categories and can explicitly clear every exclusion", async t => {
  const f = fixture(), h = await mount(f.client); t.after(h.unmount);
  await act(async () => { assert.equal(await h.state().changeExcludedEvents([]), true); });
  assert.deepEqual(f.writes[0].value, { categories: ["runs", "cases"], excludedEventTypes: [], locale: "en" });
  assert.deepEqual(h.state().settings?.excludedEventTypes, []);
});

test("all categories can be muted without clearing detailed event choices", async t => {
  const f = fixture(), h = await mount(f.client); t.after(h.unmount);
  await act(async () => { await h.state().changeCategories([]); });
  assert.deepEqual(h.state().settings?.categories, []);
  assert.deepEqual(h.state().settings?.excludedEventTypes, ["test_case.created"]);
});

test("a412 conflict refreshes the saved choices and reports conflict without replaying the write", async t => {
  let reads = 0, writes = 0;
  const client = { settings: async () => ++reads === 1 ? snapshot() : snapshot({ version: 9, categories: ["defects"], excludedEventTypes: ["run.complete"] }),
    preferences: async () => { writes++; throw new TmsApiError("private upstream text", 412, null, "NOTIFICATION_CONFLICT"); } } as unknown as NotificationClient;
  const h = await mount(client); t.after(h.unmount);
  await act(async () => { assert.equal(await h.state().changeCategories(["access"]), false); });
  assert.equal(reads, 2); assert.equal(writes, 1);
  assert.equal(h.state().error, "conflict"); assert.equal(h.state().busy, false);
  assert.equal(h.state().settings?.version, 9); assert.deepEqual(h.state().settings?.categories, ["defects"]);
  assert.deepEqual(h.state().settings?.excludedEventTypes, ["run.complete"]);
});

test("category saves use the current interface locale without reloading on locale changes", async t => {
  const f = fixture(), h = await mount(f.client); t.after(h.unmount);
  await h.update(f.client, "ru");
  await act(async () => { await h.state().changeCategories(["runs"]); });
  assert.deepEqual(f.writes[0].value, { categories: ["runs"], excludedEventTypes: ["test_case.created"], locale: "ru" });
});

test("failed exclusion saves stay openable for retry and expose only a safe save error", async t => {
  const client = { settings: async () => snapshot(), preferences: async () => { throw new Error("private upstream details"); } } as unknown as NotificationClient;
  const h = await mount(client); t.after(h.unmount);
  await act(async () => { assert.equal(await h.state().changeExcludedEvents([]), false); });
  assert.equal(h.state().error, "save"); assert.equal(h.state().busy, false);
  assert.deepEqual(h.state().settings?.excludedEventTypes, ["test_case.created"]);
});

test("a failed conflict reload blocks further writes until an explicit refresh succeeds", async t => {
  let reads = 0, writes = 0;
  const client = { settings: async () => { reads++; if (reads === 2) throw new Error("offline"); return snapshot({ version: reads === 1 ? 4 : 9 }); },
    preferences: async () => { writes++; throw new TmsApiError("changed", 412, null); } } as unknown as NotificationClient;
  const h = await mount(client); t.after(h.unmount);
  await act(async () => { assert.equal(await h.state().changeExcludedEvents([]), false); });
  assert.equal(h.state().settings, null); assert.equal(h.state().error, "load");
  await act(async () => { assert.equal(await h.state().changeCategories([]), false); }); assert.equal(writes, 1);
  await act(async () => { assert.equal(await h.state().refresh(), true); });
  assert.equal(h.state().settings?.version, 9); assert.equal(h.state().error, null);
});

test("a failed explicit refresh reports a load error while retaining confirmed settings", async t => {
  let reads = 0;
  const client = { settings: async () => { if (reads++) throw new Error("network details"); return snapshot(); } } as unknown as NotificationClient;
  const h = await mount(client); t.after(h.unmount);
  await act(async () => { assert.equal(await h.state().refresh(), false); });
  assert.equal(h.state().error, "load"); assert.equal(h.state().settings?.version, 4);
});

test("an old advanced draft cannot overwrite a refreshed version using a newer ETag", async t => {
  const f = fixture(), h = await mount(f.client); t.after(h.unmount);
  await act(async () => { await h.state().changeCategories(["access"]); });
  await act(async () => { assert.equal(await h.state().changeExcludedEvents([], 4), false); });
  assert.equal(f.writes.length, 1); assert.equal(h.state().error, "conflict");
  assert.equal(h.state().settings?.version, 5);
});

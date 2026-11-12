import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import type { NotificationClient } from "../../domain/notifications";
import { deferred, fixture, flush, mount, snapshot } from "./support/harness";

test("retained handlers from a previous workspace cannot write through its old client", async t => {
  const a = fixture(), b = fixture(snapshot({ identityId: "member-b", version: 7 }));
  const h = await mount(a.client); t.after(h.unmount); const old = h.state();
  await h.update(b.client);
  await act(async () => { await old.changeCategories([]); });
  assert.equal(a.writes.length, 0); assert.equal(b.writes.length, 0);
  assert.equal(h.state().settings?.identityId, "member-b");
});

test("late settings responses cannot replace a new workspace snapshot", async t => {
  const response = deferred<ReturnType<typeof snapshot>>(); let signal!: AbortSignal;
  const a = { settings: (value: AbortSignal) => { signal = value; return response.promise; } } as NotificationClient;
  const b = fixture(snapshot({ identityId: "member-b" })), h = await mount(a); t.after(h.unmount);
  await h.update(b.client); assert.equal(signal.aborted, true);
  await act(async () => { response.resolve(snapshot({ identityId: "member-a" })); await flush(); });
  assert.equal(h.state().settings?.identityId, "member-b"); assert.equal(h.state().error, null);
});

test("two immediate preference clicks perform one write and remain busy until refresh finishes", async t => {
  const write = deferred<void>(); let writes = 0;
  const client = { settings: async () => snapshot(), preferences: async () => { writes++; await write.promise; } } as unknown as NotificationClient;
  const h = await mount(client); t.after(h.unmount); const old = h.state();
  let pending!: Promise<unknown>;
  await act(async () => { pending = old.changeCategories([]); await old.changeCategories(["access"]); });
  assert.equal(writes, 1); assert.equal(h.state().busy, true);
  await act(async () => { write.resolve(); await pending; });
  assert.equal(h.state().busy, false);
});

test("late failed writes from the previous workspace cannot change new state or start old refreshes", async t => {
  const write = deferred<void>(); let oldReads = 0, signal!: AbortSignal;
  const a = { settings: async () => { oldReads++; return snapshot(); },
    preferences: async (...args: unknown[]) => { signal = args[args.length - 1] as AbortSignal; await write.promise; } } as unknown as NotificationClient;
  const b = fixture(snapshot({ identityId: "member-b" })), h = await mount(a); t.after(h.unmount);
  let pending!: Promise<unknown>;
  await act(async () => { pending = h.state().changeCategories([]); });
  await h.update(b.client); assert.equal(signal.aborted, true);
  await act(async () => { write.reject(new Error("old private failure")); await pending; });
  assert.equal(oldReads, 1); assert.equal(h.state().settings?.identityId, "member-b");
  assert.equal(h.state().error, null); assert.equal(h.state().busy, false);
});

test("a retained handler cannot save before the current settings are loaded or after unmount", async () => {
  const response = deferred<ReturnType<typeof snapshot>>(); let writes = 0;
  const client = { settings: () => response.promise, preferences: async () => { writes++; } } as unknown as NotificationClient;
  const h = await mount(client), old = h.state();
  let pending!: Promise<unknown>;
  await act(async () => { pending = old.changeCategories([]); await flush(); });
  const writesBeforeLoad = writes;
  await act(async () => { response.resolve(snapshot()); await pending; await flush(); });
  assert.equal(writesBeforeLoad, 0);
  const ready = h.state(); h.unmount(); await ready.changeCategories([]); assert.equal(writes, 0);
});

test("late successful writes from the previous workspace do not start an old settings read", async t => {
  const write = deferred<void>(); let oldReads = 0;
  const a = { settings: async () => { oldReads++; return snapshot(); }, preferences: () => write.promise } as unknown as NotificationClient;
  const b = fixture(snapshot({ identityId: "member-b" })), h = await mount(a); t.after(h.unmount);
  let pending!: Promise<unknown>;
  await act(async () => { pending = h.state().changeCategories([]); });
  await h.update(b.client);
  await act(async () => { write.resolve(); assert.equal(await pending, false); });
  assert.equal(oldReads, 1); assert.equal(h.state().settings?.identityId, "member-b");
});

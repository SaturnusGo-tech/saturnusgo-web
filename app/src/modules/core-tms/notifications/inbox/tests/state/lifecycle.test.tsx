import assert from "node:assert/strict";
import { test } from "node:test";
import { inboxFixture, inboxHarness, page } from "./support/harness";

test("a stale workspace request cannot repopulate the next account and unmount aborts its replacement", async () => {
  const h = inboxHarness(), other = inboxFixture();
  await h.update(other.client); assert.equal(h.fixture.lists[0].signal.aborted, true); assert.deepEqual(h.get().items, []);
  await h.resolve(0, page(["private-a"])); assert.deepEqual(h.get().items, []);
  await h.run(() => other.lists[0].resolve(page(["member-b"]))); assert.equal(h.get().items[0].id, "member-b");
  await h.run(() => void h.get().refresh()); const request = other.lists[1]; h.unmount(); assert.equal(request.signal.aborted, true);
});

test("disabling transport cancels active and queued mutations without leaking their late result", async () => {
  const h = inboxHarness(); await h.resolve(0, page(["a", "b"]));
  await h.run(() => { void h.get().read("a"); void h.get().readAll(); }); assert.equal(h.fixture.commands.length, 1);
  await h.update(h.fixture.client, false); assert.equal(h.fixture.commands[0].signal.aborted, true); assert.deepEqual(h.get().items, []);
  await h.run(() => h.fixture.commands[0].resolve()); assert.equal(h.fixture.commands.length, 1); assert.equal(h.get().unreadCount, 0); h.unmount();
});

test("read, mark-all and archive are serialized and reconcile only after each server commit", async () => {
  const h = inboxHarness(); await h.resolve(0, page(["a", "b"], null, 6));
  await h.run(() => { void h.get().read("a"); void h.get().readAll(); void h.get().archiveRead(); });
  assert.deepEqual(h.fixture.commands.map(command => command.kind), ["read"]); assert.equal(h.get().items[0].read, false);
  await h.run(() => h.fixture.commands[0].resolve()); assert.equal(h.get().unreadCount, 5);
  assert.deepEqual(h.fixture.commands.map(command => command.kind), ["read", "readAll"]);
  await h.run(() => h.fixture.commands[1].resolve()); assert.equal(h.get().unreadCount, 0); assert.ok(h.get().items.every(item => item.read));
  assert.deepEqual(h.fixture.commands.map(command => command.kind), ["read", "readAll", "archiveRead"]);
  await h.run(() => h.fixture.commands[2].resolve()); assert.deepEqual(h.get().items, []);
  assert.equal(h.fixture.lists.length, 2); await h.resolve(1, page([])); assert.equal(h.get().busy, false); h.unmount();
});

test("a load that predates a read command cannot overwrite the confirmed read state", async () => {
  const h = inboxHarness(); await h.resolve(0, page(["a"], "older"));
  await h.run(() => void h.get().refresh()); const stale = h.fixture.lists[1];
  await h.run(() => void h.get().read("a")); assert.equal(stale.signal.aborted, true);
  await h.run(() => h.fixture.commands[0].resolve()); await h.resolve(1, page(["a"], "older"));
  assert.equal(h.get().items[0].read, true);
  await h.resolve(2, { ...page(["a"], "older", 0), items: [{ ...h.get().items[0], read: true }] }); h.unmount();
});

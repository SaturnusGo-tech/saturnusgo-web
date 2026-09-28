import assert from "node:assert/strict";
import { test } from "node:test";
import { inboxHarness, item, page } from "./support/harness";

test("read and open refresh preserve older loaded pages and their next cursor; only explicit reset drops them", async () => {
  const h = inboxHarness(); await h.resolve(0, page(["a", "b"], "page2", 8));
  await h.run(() => void h.get().more()); assert.equal(h.fixture.lists[1].cursor, "page2");
  await h.resolve(1, page(["b", "c", "d"], "page3", 8)); assert.deepEqual(h.get().items.map(item => item.id), ["a", "b", "c", "d"]);
  await h.run(() => void h.get().read("c")); await h.run(() => h.fixture.commands[0].resolve());
  await h.resolve(2, page(["a", "b"], "page2", 7));
  assert.deepEqual(h.get().items.map(item => item.id), ["a", "b", "c", "d"]); assert.equal(h.get().items[2].read, true); assert.equal(h.get().next, "page3");
  await h.run(() => void h.get().refresh()); await h.resolve(3, page(["new", "a"], "first-tail", 8));
  assert.deepEqual(h.get().items.map(item => item.id), ["new", "a", "b", "c", "d"]); assert.equal(h.get().next, "page3");
  await h.run(() => void h.get().refresh(true)); await h.resolve(4, page(["new", "a"], "first-tail", 8));
  assert.deepEqual(h.get().items.map(item => item.id), ["new", "a"]); assert.equal(h.get().next, "first-tail"); h.unmount();
});

test("failed pagination preserves loaded rows and Retry requests the same cursor", async () => {
  const h = inboxHarness(); await h.resolve(0, page(["a"], "older"));
  await h.run(() => void h.get().more()); await h.run(() => h.fixture.lists[1].reject(new Error("network")));
  assert.equal(h.get().error, true); assert.equal(h.get().busy, false); assert.deepEqual(h.get().items.map(item => item.id), ["a"]);
  await h.run(() => void h.get().retry()); assert.equal(h.fixture.lists[2].cursor, "older");
  await h.resolve(2, page(["b"], null, 2)); assert.deepEqual(h.get().items.map(item => item.id), ["a", "b"]); assert.equal(h.get().error, false); h.unmount();
});

test("a completely new first page fills its pagination gap before the retained older rows", async () => {
  const h = inboxHarness(); await h.resolve(0, page(["a", "b"], "older"));
  await h.run(() => void h.get().refresh()); await h.resolve(1, page(["new1", "new2"], "gap1"));
  assert.deepEqual(h.get().items.map(item => item.id), ["new1", "new2", "a", "b"]);
  await h.run(() => void h.get().more()); assert.equal(h.fixture.lists[2].cursor, "gap1");
  await h.resolve(2, page(["middle1", "middle2"], "gap2"));
  assert.deepEqual(h.get().items.map(item => item.id), ["new1", "new2", "middle1", "middle2", "a", "b"]);
  await h.run(() => void h.get().more()); await h.resolve(3, page(["a", "b", "c"], "older2"));
  assert.deepEqual(h.get().items.map(item => item.id), ["new1", "new2", "middle1", "middle2", "a", "b", "c"]);
  assert.equal(h.get().next, "older2"); h.unmount();
});

test("failed initial refresh can retry without showing a false empty success", async () => {
  const h = inboxHarness(); await h.run(() => h.fixture.lists[0].reject(new Error("network")));
  assert.equal(h.get().loading, false); assert.equal(h.get().error, true);
  await h.run(() => void h.get().retry()); await h.resolve(1, page(["a"])); assert.equal(h.get().error, false); h.unmount();
});

test("failed read stays unread, exposes an error and retries the same id without unrelated mutations", async () => {
  const h = inboxHarness(); await h.resolve(0, page(["a", "b"]));
  await h.run(() => void h.get().read("a")); await h.run(() => h.fixture.commands[0].reject(new Error("network")));
  assert.equal(h.get().error, true); assert.equal(h.get().items[0].read, false); assert.equal(h.fixture.lists.length, 1);
  await h.run(() => void h.get().retry()); assert.equal(h.fixture.commands[1].id, "a");
  await h.run(() => h.fixture.commands[1].resolve());
  await h.resolve(1, { ...page(["a", "b"], null, 1), items: [item("a", true), item("b")] });
  assert.equal(h.get().error, false); assert.equal(h.get().unreadCount, 1); h.unmount();
});

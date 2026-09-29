import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { folderHarness } from "../folder-harness";
import { createMoveReceipt, restoreMove } from "../../../../model/move/move-undo";

const before = [{ id: "a", folderId: "first" }, { id: "b", folderId: "second" }, { id: "c", folderId: null }];
const response = { items: before.map(item => ({ ...item, folderId: "destination", changed: true, etag: `"${item.id}:2"` })), updatedCount: 3 } as Parameters<typeof createMoveReceipt>[1];
test("undo remembers separate original folders, unfiled cases and versions from the move response", () => {
  let id = 0; const receipt = createMoveReceipt(before, response, () => String(++id), 1000)!;
  assert.equal(receipt.count, 3); assert.equal(receipt.expiresAt, 16000);
  assert.deepEqual(receipt.groups.map(group => group.targetFolderId), ["first", "second", null]);
  assert.deepEqual(receipt.groups[0].items, [{ id: "a", ifMatch: '"a:2"' }]);
});
test("a no-op produces no misleading move notification", () => {
  assert.equal(createMoveReceipt(before, { ...response, items: response.items.map(item => ({ ...item, changed: false })) }), null);
});
test("partial failure never repeats completed groups and retains the retry key", async () => {
  const receipt = createMoveReceipt(before, response)!; const key = receipt.groups[1].key;
  await assert.rejects(restoreMove(receipt, async group => { if (group.targetFolderId === "second") throw new Error("Conflict"); }));
  assert.equal(receipt.groups.length, 2); assert.equal(receipt.groups[0].key, key);
  const seen: unknown[] = []; await restoreMove(receipt, async group => { seen.push(group.targetFolderId); });
  assert.deepEqual(seen, ["second", null]);
});
test("the resource exposes a receipt after refresh and clears it after guarded undo", async () => {
  const h = folderHarness(); h.derived.projectCases = [{ id: "a", etag: '"a:1"', folderId: "first" }];
  const moving = h.render().moveCases(["a"], "destination");
  h.writes[0].resolve({ data: { ...response, items: response.items.slice(0, 1) } });
  await setImmediate(); h.refreshes[0].resolve({}); await moving;
  const receipt = h.render().lastMove!; assert.equal(receipt.count, 1);
  const undo = h.render().undoMove!(receipt.id);
  assert.deepEqual(JSON.parse(JSON.stringify(h.writes[1].args[2])), { items: [{ id: "a", ifMatch: '"a:2"' }], targetFolderId: "first" });
  h.writes[1].resolve({ data: {} }); await setImmediate(); h.refreshes[1].resolve({});
  assert.equal((await undo).ok, true); assert.equal(h.render().lastMove, null);
});
test("changing project invalidates a receipt, including an old undo closure", async () => {
  const h = folderHarness(); h.derived.projectCases = [{ id: "a", etag: '"a:1"', folderId: "first" }];
  const moving = h.render().moveCases(["a"], "destination");
  h.writes[0].resolve({ data: { ...response, items: response.items.slice(0, 1) } });
  await setImmediate(); h.refreshes[0].resolve({}); await moving;
  const old = h.render(); h.derived.project.id = "other"; h.render();
  assert.equal((await old.undoMove!(old.lastMove!.id)).ok, false); assert.equal(h.writes.length, 1);
});

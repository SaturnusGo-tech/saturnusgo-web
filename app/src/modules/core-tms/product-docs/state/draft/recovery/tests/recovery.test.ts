import assert from "node:assert/strict";
import test from "node:test";
import { productDocRecovery } from "../product-doc-recovery";
import { createProductDocDraftBuffer } from "../../buffer/createProductDocDraftBuffer";
import { productDocDraftKey, type BufferedProductDocDraft } from "../../draft-buffer";
const scope = { workspaceId: "w", projectId: "p" };
const key = productDocDraftKey(scope, "doc");
const draft: BufferedProductDocDraft = { title: "Changed", sections: [{ id: "intro", title: "", markdown: "Recovered text" }],
  baseline: { title: "Original", sections: [], version: 2 } };
function storage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
test("reloading recovers unsaved documentation only for the original user, workspace and project", () => {
  const disk = storage();
  const recovery = productDocRecovery(disk, "alice", scope);
  const buffer = createProductDocDraftBuffer(recovery);
  buffer.set(key, draft);
  assert.deepEqual(createProductDocDraftBuffer(recovery).get(key), draft);
  for (const [owner, target] of [["bob", scope], ["alice", { ...scope, workspaceId: "other" }], ["alice", { ...scope, projectId: "other" }]] as const)
    assert.equal(createProductDocDraftBuffer(productDocRecovery(disk, owner, target)).size, 0);
  assert.equal(createProductDocDraftBuffer(productDocRecovery(disk, null, scope)).size, 0);
});
test("removing a document clears recovery and an in-flight save cannot resurrect it", () => {
  const recovery = productDocRecovery(storage(), "alice", scope);
  const buffer = createProductDocDraftBuffer(recovery);
  buffer.set(key, draft);
  const epoch = buffer.epoch!(key);
  buffer.delete(key);
  buffer.acknowledge!(key, draft, { ...draft, version: 3 }, epoch);
  assert.equal(buffer.size, 0);
  assert.equal(createProductDocDraftBuffer(recovery).size, 0);
});
test("a newer edit is retained and rebased after acknowledgement of the earlier snapshot", () => {
  const buffer = createProductDocDraftBuffer();
  buffer.set(key, draft);
  buffer.set(key, { ...draft, title: "Newer edit" });
  buffer.acknowledge!(key, draft, { ...draft, version: 3 }, buffer.epoch!(key));
  assert.equal(buffer.get(key)?.title, "Newer edit");
  assert.equal(buffer.get(key)?.baseline.version, 3);
  assert.equal(buffer.acknowledged!(key)?.title, "Changed");
});
test("invalid or cross-scope browser recovery is never loaded", () => {
  const disk = storage();
  const recovery = productDocRecovery(disk, "alice", scope);
  recovery.write(new Map([[key, draft]]));
  const storageKey = [...disk.values.keys()][0];
  disk.setItem(storageKey, JSON.stringify([[productDocDraftKey({ ...scope, projectId: "other" }, "doc"), draft]]));
  assert.equal(recovery.read().length, 0);
  disk.setItem(storageKey, JSON.stringify([[key, { ...draft, baseline: { version: "2" } }]]));
  assert.equal(recovery.read().length, 0);
});
test("unavailable browser storage reports once per failure period without losing live edits", () => {
  let available = false, warnings = 0;
  const buffer = createProductDocDraftBuffer({ read: () => [], write: () => available }, () => { warnings++; });
  buffer.set(key, draft); buffer.set(key, { ...draft, title: "Newer" });
  assert.equal(warnings, 1); assert.equal(buffer.get(key)?.title, "Newer");
  available = true; buffer.set(key, { ...draft, title: "Stored" });
  available = false; buffer.set(key, { ...draft, title: "Not stored" });
  assert.equal(warnings, 2);
  buffer.delete(key); assert.equal(warnings, 2);
});

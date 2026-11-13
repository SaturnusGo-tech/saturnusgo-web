import assert from "node:assert/strict";
import test from "node:test";
import { createProductDocAutosave } from "../createProductDocAutosave";
import { createProductDocDraftBuffer } from "../../buffer/createProductDocDraftBuffer";
import { productDocDraftKey, type BufferedProductDocDraft } from "../../draft-buffer";
import type { ProductDocsApi } from "../../../../domain/product-docs";
const scope = { workspaceId: "w", projectId: "p" };
const draft: BufferedProductDocDraft = { title: "Edited", sections: [{ id: "s", title: "", markdown: "Text" }],
  baseline: { title: "Original", sections: [], version: 1 } };
test("leaving flushes every buffered document and coalesces duplicate requests", async () => {
  const drafts = createProductDocDraftBuffer(), calls: string[] = [];
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const api = { async save(_scope, id, input) { calls.push(id); await pending; return { draftVersion: input.expectedDraftVersion + 1 }; } } satisfies Pick<ProductDocsApi, "save">;
  drafts.set(productDocDraftKey(scope, "one"), draft); drafts.set(productDocDraftKey(scope, "two"), draft);
  const manager = createProductDocAutosave({ api: api as ProductDocsApi, scope, drafts, untitled: "Untitled", onError: assert.fail });
  const first = manager.flush(), second = manager.flush();
  assert.equal(first, second);
  assert.deepEqual(calls, ["one"]);
  release(); assert.equal(await first, true);
  assert.deepEqual(calls, ["one", "two"]); assert.equal(drafts.size, 0);
});
test("a 409 or offline failure keeps edits and version intact for a deliberate retry", async () => {
  for (const error of [new Error("Offline"), { code: "PRODUCT_DOC_STALE_DRAFT", status: 409 }]) {
    const drafts = createProductDocDraftBuffer(), key = productDocDraftKey(scope, "doc");
    drafts.set(key, draft); let failing = true, failures = 0;
    const api = { async save() { if (failing) throw error; return { draftVersion: 2 }; } } as unknown as ProductDocsApi;
    const manager = createProductDocAutosave({ api, scope, drafts, untitled: "Untitled", onError: () => { failures++; } });
    assert.equal(await manager.flush(), false); assert.equal(failures, 1);
    assert.equal(drafts.get(key), draft); assert.equal(drafts.get(key)?.baseline.version, 1);
    failing = false; assert.equal(await manager.flush(), true); assert.equal(drafts.size, 0);
  }
});
test("edits typed while a save is pending are saved next with the acknowledged version", async () => {
  const drafts = createProductDocDraftBuffer(), key = productDocDraftKey(scope, "doc");
  drafts.set(key, draft); const calls: { title: string; version: number }[] = [];
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const api = { async save(_scope, _id, input) {
    calls.push({ title: input.title, version: input.expectedDraftVersion });
    if (calls.length === 1) await pending;
    return { draftVersion: input.expectedDraftVersion + 1 };
  } } satisfies Pick<ProductDocsApi, "save">;
  const manager = createProductDocAutosave({ api: api as ProductDocsApi, scope, drafts, untitled: "Untitled", onError: assert.fail });
  const leaving = manager.flush(); drafts.set(key, { ...draft, title: "Latest" }); release();
  assert.equal(await leaving, true);
  assert.deepEqual(calls, [{ title: "Edited", version: 1 }, { title: "Latest", version: 2 }]);
  assert.equal(drafts.acknowledged!(key)?.title, "Latest");
});
test("deleted, blocked and disposed drafts cannot be resurrected or silently saved", async () => {
  const drafts = createProductDocDraftBuffer(), key = productDocDraftKey(scope, "doc");
  let calls = 0, release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const api = { async save() { calls++; await pending; return { draftVersion: 2 }; } } as unknown as ProductDocsApi;
  drafts.set(key, { ...draft, blocked: true });
  const manager = createProductDocAutosave({ api, scope, drafts, untitled: "Untitled", onError: () => {} });
  assert.equal(await manager.flush(), false); assert.equal(calls, 0);
  drafts.set(key, draft); const saving = manager.flush(); drafts.delete(key); release();
  assert.equal(await saving, true); assert.equal(drafts.size, 0);
  drafts.set(key, draft); manager.dispose(); assert.equal(await manager.flush(), false);
});

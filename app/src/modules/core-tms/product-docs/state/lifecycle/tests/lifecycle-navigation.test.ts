import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import type { useProductDocLifecycle } from "../useProductDocLifecycle";
import { productDocDraftKey } from "../../draft/draft-buffer";
import { productDocsCopy } from "../../../localization/copy";
import type { ProductDocNode, ProductDocsApi } from "../../../domain/product-docs";

const scope = { workspaceId: "w", projectId: "p" };
const root: ProductDocNode = { id: "root", title: "Root", kind: "page", parentId: null, draftVersion: 1, publishedVersion: 1 };
function fixture() {
  const h = componentHarness();
  const { useProductDocLifecycle: useLifecycle } = h.load<{ useProductDocLifecycle: typeof useProductDocLifecycle }>(
    new URL("../useProductDocLifecycle.ts", import.meta.url), name => name.endsWith("draft-buffer") ? { productDocDraftKey } : undefined);
  let changes = 0;
  const selections: unknown[] = [];
  let input: Parameters<typeof useLifecycle>[0] = { api: {} as ProductDocsApi, scope, copy: productDocsCopy("en"), locale: "en",
    drafts: new Map(), selection: { docId: "child" }, path: [root], onSelect: next => selections.push(next), onChanged: () => { changes++; } };
  const content = { title: "Unsaved", sections: [], baseline: { title: "Saved", sections: [], version: 1 } };
  for (const id of ["root", "child", "unrelated"]) input.drafts.set(productDocDraftKey(scope, id), content);
  input.drafts.set(productDocDraftKey({ workspaceId: "other", projectId: "p" }, "root"), content);
  const render = (next: Partial<typeof input> = {}) => { input = { ...input, ...next }; return h.render(() => useLifecycle(input)); };
  return { h, render, input: () => input, selections, changes: () => changes };
}

test("successful branch removal leaves descendant and foreign buffers intact and redirects the current descendant", t => {
  const f = fixture(); t.after(f.h.dispose);
  f.render().onCompleted(root, "delete", ["root", "child"]);
  assert.equal(f.input().drafts.has(productDocDraftKey(scope, "root")), false);
  assert.equal(f.input().drafts.has(productDocDraftKey(scope, "child")), true, "a child may have moved out concurrently");
  assert.equal(f.input().drafts.has(productDocDraftKey(scope, "unrelated")), true);
  assert.equal(f.input().drafts.size, 3);
  assert.deepEqual(f.selections, [undefined]); assert.equal(f.changes(), 1);
});

test("completion uses current navigation and keeps immutable pinned publications open", t => {
  for (const selection of [{ docId: "child", version: 2 }, { docId: "unrelated" }]) {
    const f = fixture(); t.after(f.h.dispose); const accepted = f.render();
    f.render({ selection, path: selection.docId === "child" ? [root] : [] });
    accepted.onCompleted(root, "archive", ["root"]);
    assert.equal(f.selections.length, 0); assert.equal(f.changes(), 1);
  }
});

test("a completion from an old HTTP/session owner cannot change current buffers or navigation", t => {
  const f = fixture(); t.after(f.h.dispose); const accepted = f.render();
  f.render({ api: {} as ProductDocsApi });
  accepted.onCompleted(root, "delete", ["root"]);
  assert.equal(f.input().drafts.size, 4); assert.equal(f.selections.length, 0); assert.equal(f.changes(), 0);
});

test("an unfinished ancestry read returns to overview without discarding the selected draft", t => {
  const f = fixture(); t.after(f.h.dispose);
  f.render({ path: undefined }).onCompleted(root, "delete", ["root"]);
  assert.deepEqual(f.selections, [undefined]);
  assert.equal(f.input().drafts.has(productDocDraftKey(scope, "child")), true);
});

test("same-client identity changes invalidate old lifecycle completions", t => {
  const f = fixture(); t.after(f.h.dispose);
  const accepted = f.render({ ownerId: "first-identity" });
  f.render({ ownerId: "second-identity" });
  accepted.onCompleted(root, "delete", ["root"]);
  assert.equal(f.input().drafts.size, 4); assert.equal(f.selections.length, 0); assert.equal(f.changes(), 0);
});

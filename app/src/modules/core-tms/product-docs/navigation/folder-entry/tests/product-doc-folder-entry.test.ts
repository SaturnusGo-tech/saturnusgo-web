import assert from "node:assert/strict";
import test from "node:test";
import type { ProductDocNode, ProductDocsApi } from "../../../domain/product-docs";
import { resolveProductDocFolderEntry } from "../product-doc-folder-entry";

const scope = { workspaceId: "workspace", projectId: "project" };
const folder = (id: string, parentId: string | null = null): ProductDocNode => ({
  id, parentId, kind: "folder", title: id, publishedVersion: null, draftVersion: 1,
});
const article = (id: string, parentId: string): ProductDocNode => ({
  id, parentId, kind: "page", title: id, publishedVersion: 1, draftVersion: 1,
});

function fixture(children: Readonly<Record<string, ProductDocNode[]>>, cases: Record<string, string> = {}, signal?: AbortSignal) {
  const calls: string[] = [];
  const articleCalls: string[] = [];
  const api: Pick<ProductDocsApi, "list" | "listArticleCases"> = {
    async list(requestScope, options) {
      assert.deepEqual(requestScope, scope);
      assert.equal(options?.signal, signal);
      const key = [options?.parentId, options?.cursor].filter(Boolean).join(":");
      calls.push(key);
      return { nodes: children[key] ?? [], nextCursor: key === "root" && "root:2" in children ? "2" : null,
        canEdit: false, canPublish: false };
    },
    async listArticleCases(requestScope, docId, options) {
      assert.deepEqual(requestScope, scope);
      assert.deepEqual(options, { limit: 1, signal });
      articleCalls.push(docId);
      return { cases: cases[docId] ? [{ caseId: cases[docId], title: "Case", sectionId: null }] : [], nextCursor: null };
    },
  };
  return { api, calls, articleCalls };
}

test("folder entry reads remaining siblings before following nested folders", async () => {
  const root = folder("root");
  const nearest = article("direct article", root.id);
  const { api, calls } = fixture({ root: [folder("nested", root.id)], "root:2": [nearest] }, { [nearest.id]: "case" });
  assert.deepEqual(await resolveProductDocFolderEntry(api, scope, root), { node: nearest, caseId: "case" });
  assert.deepEqual(calls, ["root", "root:2"]);
});

test("folder entry prefers linked shallow articles and preserves server order among equal-depth articles", async () => {
  const root = folder("root");
  const first = folder("first", root.id);
  const second = folder("second", root.id);
  const nearest = article("shallow article", second.id);
  const { api, calls, articleCalls } = fixture({
    root: [article("unlinked", root.id), first, second], first: [folder("deep", first.id)],
    second: [nearest, article("also shallow", second.id)],
    deep: [article("deep article", "deep")],
  }, { [nearest.id]: "shallow-case", "also shallow": "another-case", "deep article": "deep-case" });
  assert.deepEqual(await resolveProductDocFolderEntry(api, scope, root), { node: nearest, caseId: "shallow-case" });
  assert.deepEqual(calls, ["root", "unlinked", "first", "second"]);
  assert.deepEqual(articleCalls, ["unlinked", "shallow article"]);
});

test("folder entry falls back to the first visible article if no article links a case", async () => {
  const root = folder("root");
  const nearest = article("direct article", root.id);
  const { api, articleCalls } = fixture({ root: [
    { ...article("archived article", root.id), archivedAt: "2026-11-09T00:00:00Z" },
    nearest,
    { ...article("draft", root.id), publishedVersion: null },
  ] });
  assert.deepEqual(await resolveProductDocFolderEntry(api, scope, root, { draft: true }), { node: nearest });
  assert.deepEqual(articleCalls, ["direct article"]);
});

test("folder entry keeps an empty folder browsable and honors a canceled selection", async () => {
  const root = folder("root");
  const controller = new AbortController();
  const { api, calls } = fixture({ root: [folder("empty", root.id)] }, {}, controller.signal);
  assert.deepEqual(await resolveProductDocFolderEntry(api, scope, root, { signal: controller.signal }), { node: root });
  controller.abort();
  await assert.rejects(resolveProductDocFolderEntry(api, scope, root, { signal: controller.signal }), { name: "AbortError" });
  assert.deepEqual(calls, ["root", "empty"]);
});

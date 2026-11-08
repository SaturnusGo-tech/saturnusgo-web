import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { productDocErrorCode } from "../../../domain/errors/product-doc-response";
import type { ProductDocDetail, ProductDocNode, ProductDocsApi } from "../../../domain/product-docs";
import { productDocsCopy } from "../../../localization/copy";
import type { useProductDocList } from "../../../state/tree/useProductDocList";
import type { useProductDocResource } from "../../../state/useProductDocResource";
import type { useProductDocSelection } from "../../../state/useProductDocSelection";
import type { ArchiveProductDoc } from "../ArchiveProductDoc";
import type { ProductDocsArchive } from "../ProductDocsArchive";

const scope = { workspaceId: "workspace", projectId: "project" };
const node: ProductDocNode = {
  id: "doc", parentId: null, kind: "folder", title: "Release checklist",
  draftVersion: 3, publishedVersion: null,
};
const copy = productDocsCopy("en");
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("archiving a published page confirms against the current draft version", async (context) => {
  const h = componentHarness();
  context.after(h.dispose);
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(
    new URL("../../../state/useProductDocResource.ts", import.meta.url),
  );
  const selection = h.load<{ useProductDocSelection: typeof useProductDocSelection }>(
    new URL("../../../state/useProductDocSelection.ts", import.meta.url),
    (name) => name.endsWith("useProductDocResource") ? resource : undefined,
  );
  const { ArchiveProductDoc: View } = h.load<{ ArchiveProductDoc: typeof ArchiveProductDoc }>(
    new URL("../ArchiveProductDoc.tsx", import.meta.url),
    (name) => name.endsWith("product-doc-response") ? { productDocErrorCode }
      : name.endsWith("useProductDocSelection") ? selection : undefined,
  );
  const published: ProductDocNode = { ...node, kind: "page", publishedVersion: 1 };
  const draft: ProductDocDetail = { ...published, title: "Updated checklist", draftVersion: 7,
    sections: [], version: null, canEdit: true, canPublish: true };
  const reads: Parameters<ProductDocsApi["get"]>[] = [];
  const calls: Parameters<ProductDocsApi["setArchived"]>[] = [];
  let loadDraft!: (current: ProductDocDetail) => void;
  let complete!: (receipt: Awaited<ReturnType<ProductDocsApi["setArchived"]>>) => void;
  const api = {
    get: (...args: Parameters<ProductDocsApi["get"]>) => {
      reads.push(args);
      return new Promise<ProductDocDetail>((resolve) => { loadDraft = resolve; });
    },
    setArchived: (...args: Parameters<ProductDocsApi["setArchived"]>) => {
      calls.push(args);
      return new Promise<Awaited<ReturnType<ProductDocsApi["setArchived"]>>>((resolve) => { complete = resolve; });
    },
  } as ProductDocsApi;
  let archived = 0;
  let closed = false;
  const render = () => nodes(h.render(() => View({
    api, scope, node: published, copy, onArchived: () => { archived++; }, onClose: () => { closed = true; },
  })));
  const findConfirm = (items: ReturnType<typeof render>) => items.find(
    (item) => item.type === "button" && item.props.children === copy.archiveItem,
  );
  const initial = findConfirm(render());
  assert.ok(initial);
  assert.equal(initial.props.disabled, true);
  assert.equal(reads[0][2]?.draft, true);
  invoke(initial, "onClick");
  assert.equal(calls.length, 0);
  loadDraft(draft);
  await flush();
  const ready = render();
  assert.ok(ready.some((item) => item.props.subtitle === draft.title));
  const confirm = findConfirm(ready);
  assert.ok(confirm);
  assert.ok(!confirm.props.disabled);
  invoke(confirm, "onClick");
  invoke(confirm, "onClick");
  const cancel = render().find((item) => item.type === "button" && item.props.children === copy.cancel);
  assert.ok(cancel);
  invoke(cancel, "onClick");
  assert.equal(closed, false);
  assert.equal(archived, 0);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].slice(0, 3), [scope, node.id, true]);
  assert.equal(calls[0][3].expectedDraftVersion, draft.draftVersion);
  complete({ draftVersion: 8, archivedAt: "2026-11-08T00:00:00Z", affectedCount: 1 });
  await flush();
  assert.equal(archived, 1);
});

test("the archive shelf restores a scoped archived node and refreshes the tree", async (context) => {
  const h = componentHarness();
  context.after(h.dispose);
  const list = h.load<{ useProductDocList: typeof useProductDocList }>(
    new URL("../../../state/tree/useProductDocList.ts", import.meta.url),
  );
  const { ProductDocsArchive: View } = h.load<{ ProductDocsArchive: typeof ProductDocsArchive }>(
    new URL("../ProductDocsArchive.tsx", import.meta.url),
    (name) => name.endsWith("useProductDocList") ? list : undefined,
  );
  const calls: Parameters<ProductDocsApi["setArchived"]>[] = [];
  const listing: Parameters<ProductDocsApi["list"]>[] = [];
  let changed = false;
  const api = {
    list: async (...args: Parameters<ProductDocsApi["list"]>) => {
      listing.push(args);
      return { nodes: [{ ...node, archivedAt: "2026-11-08T00:00:00Z" }], canEdit: true, canPublish: true, nextCursor: null };
    },
    setArchived: async (...args: Parameters<ProductDocsApi["setArchived"]>) => {
      calls.push(args);
      return { draftVersion: 4, archivedAt: null, affectedCount: 1 };
    },
  } as ProductDocsApi;
  const render = () => nodes(h.render(() => View({ api, scope, copy, refresh: 0, onChanged: () => { changed = true; } })));
  assert.equal(render().find((item) => item.props["aria-label"] === `Restore ${node.title}`), undefined);
  await Promise.resolve();
  assert.equal(listing[0][1]?.archived, true);
  const restore = render().find((item) => item.props["aria-label"] === `Restore ${node.title}`);
  assert.ok(restore);
  invoke(restore, "onClick");
  await flush();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].slice(0, 3), [scope, node.id, false]);
  assert.equal(calls[0][3].expectedDraftVersion, 3);
  assert.equal(changed, true);
});

import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { productDocErrorCode } from "../../../domain/errors/product-doc-response";
import type { ProductDocDetail, ProductDocNode, ProductDocsApi } from "../../../domain/product-docs";
import { productDocsCopy } from "../../../localization/copy";
import type { useProductDocList } from "../../../state/tree/useProductDocList";
import type { useProductDocResource } from "../../../state/useProductDocResource";
import type { ProductDocLifecycleDialog } from "../../lifecycle/dialog/ProductDocLifecycleDialog";
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
  const { ProductDocLifecycleDialog: View } = h.load<{ ProductDocLifecycleDialog: typeof ProductDocLifecycleDialog }>(
    new URL("../../lifecycle/dialog/ProductDocLifecycleDialog.tsx", import.meta.url),
    (name) => name === "@heroui/react" ? { Button: "Button" }
      : name.endsWith("product-doc-response") ? { productDocErrorCode }
      : name.endsWith("draft-buffer") ? { productDocDraftKey: (scope: { workspaceId: string; projectId: string }, id: string) => JSON.stringify([scope.workspaceId, scope.projectId, id]) }
      : name.endsWith("useProductDocResource") ? resource : undefined,
  );
  const published: ProductDocNode = { ...node, kind: "page", publishedVersion: 1 };
  const draft: ProductDocDetail = { ...published, title: "Updated checklist", draftVersion: 1,
    lifecycleVersion: 7, sections: [], version: 1, canEdit: false, canPublish: false, canArchive: true };
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
  const render = () => {
    const rendered = nodes(h.render(() => View({
      context: { api, scope, copy, locale: "en", drafts: new Map(), onCompleted: () => { archived++; }, onChanged: () => {} },
      node: published, mode: "archive", canEdit: false, onClose: () => { closed = true; },
    })));
    const modal = rendered.find(node => node.type === "ProductDocModal")!;
    return typeof modal.props.children === "function" ? [...rendered, ...nodes(modal.props.children(() => {
      if (!modal.props.busy) closed = true;
    }))] : rendered;
  };
  const findConfirm = (items: ReturnType<typeof render>) => items.find(
    (item) => item.type === "Button" && item.props.children === copy.archiveItem,
  );
  const initial = findConfirm(render());
  assert.ok(initial);
  assert.equal(initial.props.isDisabled, true);
  assert.equal(reads[0][2]?.draft, false, "readers must not request private draft content to archive a readable publication");
  invoke(initial, "onPress");
  assert.equal(calls.length, 0);
  loadDraft(draft);
  await flush();
  const ready = render();
  assert.ok(ready.some((item) => item.props.subtitle === published.title), "the confirmation title stays stable across metadata loading");
  const confirm = findConfirm(ready);
  assert.ok(confirm);
  assert.ok(!confirm.props.isDisabled);
  invoke(confirm, "onPress");
  invoke(confirm, "onPress");
  const cancel = render().find((item) => item.type === "Button" && item.props.children === copy.cancel);
  assert.ok(cancel);
  invoke(cancel, "onPress");
  assert.equal(closed, false);
  assert.equal(archived, 0);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].slice(0, 3), [scope, node.id, true]);
  assert.equal(calls[0][3].expectedDraftVersion, draft.lifecycleVersion);
  complete({ draftVersion: 8, archivedAt: "2026-11-08T00:00:00Z", affectedCount: 1 });
  await flush();
  assert.equal(archived, 1);
});

test("the archive shelf exposes lifecycle actions through one menu without a direct restore button", async context => {
  const h = componentHarness(); context.after(h.dispose);
  const list = h.load<{ useProductDocList: typeof useProductDocList }>(
    new URL("../../../state/tree/useProductDocList.ts", import.meta.url));
  const { ProductDocsArchive: View } = h.load<{ ProductDocsArchive: typeof ProductDocsArchive }>(
    new URL("../ProductDocsArchive.tsx", import.meta.url),
    name => name.endsWith("useProductDocList") ? list : undefined);
  const api = { list: async () => ({ nodes: [{ ...node, archivedAt: "2026-11-08" }],
    canPublish: true, canDelete: true, nextCursor: null }) } as unknown as ProductDocsApi;
  const lifecycle = { api, scope, copy, locale: "en" as const, drafts: new Map(), onCompleted() {}, onChanged() {} };
  const render = () => nodes(h.render(() => View({ api, scope, copy, refresh: 0, onChanged() {}, lifecycle })));
  render(); await flush(); const view = render();
  assert.equal(view.some(item => item.props["aria-label"] === `Restore ${node.title}`), false);
  const menu = view.find(item => item.type === "ProductDocItemMenu"); assert.ok(menu);
  const permissions = menu.props.permissions as { canPublish?: boolean; canDelete?: boolean };
  assert.equal(permissions.canPublish, true);
  assert.equal(permissions.canDelete, true);
});

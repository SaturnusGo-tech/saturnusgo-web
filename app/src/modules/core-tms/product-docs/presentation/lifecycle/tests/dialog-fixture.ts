import type { ProductDocDetail, ProductDocsApi } from "../../../domain/product-docs";
import { productDocErrorCode } from "../../../domain/errors/product-doc-response";
import { productDocDraftKey } from "../../../state/draft/draft-buffer";
import type { ProductDocDraftBuffer } from "../../../state/draft/draft-buffer";
import { productDocsCopy } from "../../../localization/copy";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { useProductDocResource } from "../../../state/useProductDocResource";
import type { ProductDocLifecycleDialog } from "../dialog/ProductDocLifecycleDialog";

export const scope = { workspaceId: "workspace", projectId: "project" };
export const root: ProductDocDetail = { id: "root", parentId: null, kind: "page", title: "Untitled page",
  draftVersion: 1, lifecycleVersion: 9, publishedVersion: 1, version: 1, sections: [],
  canEdit: false, canPublish: false, canArchive: true, canDelete: true };
export const flush = () => new Promise<void>(resolve => setImmediate(resolve));

export function dialogFixture(current: ProductDocDetail = root, mode: "archive" | "delete" = "archive", canEdit = false) {
  const h = componentHarness();
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../../state/useProductDocResource.ts", import.meta.url));
  const { ProductDocLifecycleDialog: View } = h.load<{ ProductDocLifecycleDialog: typeof ProductDocLifecycleDialog }>(
    new URL("../dialog/ProductDocLifecycleDialog.tsx", import.meta.url), name => {
      if (name === "@heroui/react") return { Button: "Button" };
      if (name.endsWith("product-doc-response")) return { productDocErrorCode };
      if (name.endsWith("draft-buffer")) return { productDocDraftKey };
      if (name.endsWith("useProductDocResource")) return resource;
    });
  const reads: Parameters<ProductDocsApi["get"]>[] = [];
  const operations: { mode: string; scope: typeof scope; id: string; input: { expectedDraftVersion: number }; key?: string;
    resolve(): void; reject(error: unknown): void }[] = [];
  const completed: { id: string; affected: readonly string[] }[] = [];
  const drafts: ProductDocDraftBuffer = new Map();
  let closed = 0, modalDismisses = 0;
  const api = { get: async (...args: Parameters<ProductDocsApi["get"]>) => { reads.push(args); return current; },
    setArchived: (target: typeof scope, id: string, _archived: boolean, input: { expectedDraftVersion: number }) =>
      new Promise(resolve => operations.push({ mode: "archive", scope: target, id, input,
        resolve: () => resolve({ draftVersion: 10, archivedAt: "2026-11-13", affectedCount: 3 }), reject: () => {} })),
    delete: (target: typeof scope, id: string, input: { expectedDraftVersion: number }, options: { idempotencyKey: string }) =>
      new Promise((resolve, reject) => operations.push({ mode: "delete", scope: target, id, input, key: options.idempotencyKey,
        resolve: () => resolve({ draftVersion: 10, deletedAt: "2026-11-13", affectedCount: 3 }), reject })),
  } as ProductDocsApi;
  let props: Parameters<typeof View>[0] = { context: { api, scope, copy: productDocsCopy("en"), locale: "en", drafts,
    onCompleted: (node, _mode, affected) => completed.push({ id: node.id, affected }), onChanged() {} },
    node: { ...root, publishedVersion: current.publishedVersion, archivedAt: current.archivedAt }, mode, canEdit, onClose: () => { closed++; } };
  const render = (next: Partial<typeof props> = {}) => {
    props = { ...props, ...next };
    const rendered = nodes(h.render(() => View(props)));
    const modal = rendered.find(node => node.type === "ProductDocModal")!;
    return typeof modal.props.children === "function"
      ? [...rendered, ...nodes(modal.props.children(() => { modalDismisses++; }))] : rendered;
  };
  const confirm = () => render().find(node => node.type === "Button" && node.props.children === (mode === "archive" ? "Archive item" : "Delete item"))!;
  return { h, render, confirm, reads, operations, completed, drafts, props: () => props,
    closed: () => closed, modalDismisses: () => modalDismisses };
}

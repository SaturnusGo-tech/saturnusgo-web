import assert from "node:assert/strict";
import { componentHarness, invoke, nodes, type Node } from "../../../../portfolios/tests/support/component-harness";
import { isMissingProductDoc, productDocErrorCode } from "../../../domain/errors/product-doc-response";
import type { ProductDocDetail, ProductDocList, ProductDocNode, ProductDocsApi } from "../../../domain/product-docs";
import { productDocsCopy } from "../../../localization/copy";
import type { useProductDocResource } from "../../../state/useProductDocResource";
import type { useProductDocSelection } from "../../../state/useProductDocSelection";
import type { MoveProductDoc } from "../MoveProductDoc";

export const scope = { workspaceId: "workspace", projectId: "project" };
export const page: ProductDocNode = { id: "source", parentId: "old-parent", title: "Release guide", kind: "page", draftVersion: 2, publishedVersion: 1 };
export const draft: ProductDocDetail = { ...page, draftVersion: 9, version: null, sections: [], canEdit: true, canPublish: true };
export const copy = productDocsCopy("en");
export const flush = () => new Promise<void>(resolve => setImmediate(resolve));
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

export function moveHarness() {
  const h = componentHarness();
  const reads: (ReturnType<typeof deferred<ProductDocDetail>> & { args: Parameters<ProductDocsApi["get"]> })[] = [];
  const moves: (ReturnType<typeof deferred<{ draftVersion: number }>> & { args: Parameters<ProductDocsApi["move"]> })[] = [];
  const callbacks: string[] = [];
  const listing = { data: { nodes: [], nextCursor: null, canEdit: true, canPublish: true } as ProductDocList,
    error: false, loading: false, retry() {}, more() {} };
  const branches: unknown[][] = [];
  const api = {
    get: (...args: Parameters<ProductDocsApi["get"]>) => {
      const request = { ...deferred<ProductDocDetail>(), args }; reads.push(request); return request.promise;
    },
    move: (...args: Parameters<ProductDocsApi["move"]>) => {
      const request = { ...deferred<{ draftVersion: number }>(), args }; moves.push(request); return request.promise;
    },
  } as ProductDocsApi;
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(
    new URL("../../../state/useProductDocResource.ts", import.meta.url));
  const selection = h.load<{ useProductDocSelection: typeof useProductDocSelection }>(
    new URL("../../../state/useProductDocSelection.ts", import.meta.url), name =>
      name.endsWith("useProductDocResource") ? resource : name.endsWith("product-doc-response") ? { isMissingProductDoc } : undefined);
  const { MoveProductDoc: View } = h.load<{ MoveProductDoc: typeof MoveProductDoc }>(
    new URL("../MoveProductDoc.tsx", import.meta.url), name => name === "@heroui/react" ? { Button: "Button" }
      : name.endsWith("product-doc-response") ? { productDocErrorCode }
      : name.endsWith("useProductDocSelection") ? selection
      : name.endsWith("useProductDocList") ? { useProductDocList: (...args: unknown[]) => { branches.push(args); return listing; } } : undefined);
  const render = () => nodes(h.render(() => View({ api, scope, document: page, copy,
    path: [page], onMoved: () => callbacks.push("moved"), onClose: () => callbacks.push("close") })));
  const find = (type: string, predicate: (node: Node) => boolean = () => true) => {
    const node = render().find(node => node.type === type && predicate(node));
    assert.ok(node, `Missing ${type}`); return node;
  };
  const branch = () => {
    const node = render().find(node => typeof node.type === "function" && (node.type as Function).name === "MoveBranch");
    assert.ok(node, "Missing destination branch");
    return node as unknown as { type(props: Record<string, unknown>): unknown; props: Record<string, unknown> };
  };
  return { render, find, branch, reads, moves, callbacks, listing, branches, dispose: h.dispose,
    chooseRoot: () => invoke(find("FolderChoiceRow", node => node.props.name === copy.projectRoot), "onChoose"),
    submit: () => invoke(find("form"), "onSubmit", { preventDefault() {} }),
    confirm: () => find("Button", node => node.props.type === "submit"),
  };
}

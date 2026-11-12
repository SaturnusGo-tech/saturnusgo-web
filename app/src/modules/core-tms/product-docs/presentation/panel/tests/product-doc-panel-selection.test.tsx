import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { type TestContext } from "node:test";
import { runInNewContext } from "node:vm";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type { ProductDocDetail, ProductDocsApi, ProductDocSelection } from "../../../domain/product-docs";
import { productDocsCopy } from "../../../localization/copy";
import { useProductDocSelection } from "../../../state/useProductDocSelection";
import { useProductDocList } from "../../../state/tree/useProductDocList";

const scope = { workspaceId: "workspace", projectId: "project" };
const draft: ProductDocDetail = { id: "subdoc", parentId: "overview", kind: "page", title: "Nested workflow",
  draftVersion: 2, publishedVersion: null, version: null, sections: [], canEdit: true, canPublish: true };
const missing = { status: 404, code: "PRODUCT_DOC_NOT_FOUND" };
const denied = { status: 403, code: "PRODUCT_DOC_ACCESS_DENIED" };

function loadPanel() {
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL("../ProductDocsPanel.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, { module, exports: module.exports, require(name: string) {
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "framer-motion") return { AnimatePresence: ({ children }: React.PropsWithChildren) => children, motion: { aside: "aside" }, useReducedMotion: () => false, useIsPresent: () => true };
    if (name === "lucide-react") return { BookOpen: "svg", Maximize2: "svg", X: "svg" };
    if (name.endsWith("useGuidePanelWidth")) return { useGuidePanelWidth: () => ({ desktop: true }) };
    if (name.endsWith("AppOverlay")) return { AppOverlay: React.Fragment };
    if (name.endsWith("/copy")) return { productDocsCopy };
    if (name.endsWith("useProductDocSelection")) return { useProductDocSelection };
    if (name.endsWith("useProductDocList")) return { useProductDocList };
    if (name.endsWith("ProductDocsContext")) return { useProductDocsWorkspace: () => null };
    if (name.endsWith("ProductDocRelatedCases")) return { ProductDocRelatedCases: () => null };
    if (name.endsWith("ProductDocArticle")) return { ProductDocArticle: ({ document }: { document: ProductDocDetail }) => React.createElement("article", null, document.title) };
    if (name.endsWith("ReadState")) return { ReadState: ({ status }: { status: string }) => React.createElement("p", { role: "status" }, status) };
    if (name.endsWith(".css")) return { default: {} };
    throw new Error(`Unexpected panel dependency ${name}`);
  } });
  return module.exports as typeof import("../ProductDocsPanel");
}

async function openPanel(t: TestContext, options: { canEdit: boolean; selection?: ProductDocSelection; published?: ProductDocDetail; failure?: unknown; draftFailure?: unknown }) {
  const calls: Array<{ draft: boolean; version?: number }> = [];
  const api = {
    async list(requestScope) {
      assert.deepEqual(requestScope, scope);
      return { nodes: [draft], nextCursor: null, canEdit: options.canEdit, canPublish: options.canEdit };
    },
    async get(requestScope, id, request) {
      assert.deepEqual(requestScope, scope);
      assert.equal(id, "subdoc");
      calls.push({ draft: Boolean(request?.draft), version: request?.version });
      if (request?.draft) {
        if (options.draftFailure) throw options.draftFailure;
        return draft;
      }
      if (options.published) return options.published;
      throw options.failure ?? missing;
    },
  } satisfies Pick<ProductDocsApi, "get" | "list">;
  const { ProductDocsPanel } = loadPanel();
  let renderer!: ReactTestRenderer;
  t.after(() => act(() => renderer.unmount()));
  await act(async () => { renderer = create(<ProductDocsPanel api={api as unknown as ProductDocsApi} scope={scope} locale="en"
    selection={options.selection ?? { docId: "subdoc" }} onClose={() => {}} />); });
  return { renderer, calls };
}

test("an embedded subdoc opens the authorized draft just like the docs tree", async t => {
  const { renderer, calls } = await openPanel(t, { canEdit: true });
  assert.deepEqual(renderer.root.findAllByType("article").map(article => article.children.join("")), ["Nested workflow"]);
  assert.ok(calls.some(call => call.draft));
});

test("readers and explicit publication links never fall back to a draft", async t => {
  for (const options of [{ canEdit: false }, { canEdit: true, selection: { docId: "subdoc", version: 7 } }]) {
    const { renderer, calls } = await openPanel(t, options);
    assert.equal(renderer.root.findByProps({ role: "status" }).children.join(""), "error");
    assert.ok(calls.every(call => !call.draft));
  }
});

test("a denied publication or inaccessible draft remains unavailable", async t => {
  for (const options of [{ canEdit: true, failure: denied }, { canEdit: true, draftFailure: missing }]) {
    const { renderer } = await openPanel(t, options);
    assert.equal(renderer.root.findByProps({ role: "status" }).children.join(""), "error");
  }
});

test("a latest publication stays published even when its draft can be edited", async t => {
  const { renderer, calls } = await openPanel(t, { canEdit: true, published: { ...draft, version: 1, publishedVersion: 1, title: "Published workflow" } });
  assert.deepEqual(renderer.root.findAllByType("article").map(article => article.children.join("")), ["Published workflow"]);
  assert.ok(calls.every(call => !call.draft));
});

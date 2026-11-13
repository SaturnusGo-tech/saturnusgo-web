import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { type TestContext } from "node:test";
import { runInNewContext } from "node:vm";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type { ProductDocDetail, ProductDocsApi } from "../../../domain/product-docs";
import { emptyProductDocTaxonomy } from "../../../domain/product-doc-taxonomy";
import { emptyProductDocProperties } from "../../../domain/properties/product-doc-properties";
import { productDocsCopy } from "../../../localization/copy";
import { productDocDraftKey } from "../../../state/draft/draft-buffer";
import { useBufferedProductDocDraft } from "../../../state/draft/buffer/useBufferedProductDocDraft";
import { productDocSaveError } from "../actions/navigation/productDocSaveError";
import { changeTitleHighlights, trimTitleHighlights } from "../title/model/productDocTitleHighlights";

const scope = { workspaceId: "workspace", projectId: "project" };
const document: ProductDocDetail = { id: "doc", parentId: null, kind: "page", title: "Workflow",
  draftVersion: 2, publishedVersion: 1, version: null, sections: [{ id: "intro", title: "", markdown: "Current draft" }], canEdit: true, canPublish: true };
type Host = Parameters<ReactTestRenderer["root"]["findByType"]>[0];
const ui = { DraftActions: "draft-actions", ProductDocDraftNavigation: "draft-navigation", ProductDocDraftSurface: "draft-surface",
  ProductDocRelatedCases: "related-cases", ProductDocReviewAction: "review-action", ProductDocPublishPreview: "publish-preview", ProductDocItemMenu: "item-menu" };

function loadDraft() {
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL("../ProductDocDraft.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, { module, exports: module.exports, crypto: globalThis.crypto, require(name: string) {
    if (name === "react") return React;
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: () => unknown) => { await action(); return true; } };
    if (name === "react/jsx-runtime") return jsx;
    if (name === "react-dom") return { createPortal: (children: React.ReactNode) => children };
    for (const [component, stub] of Object.entries(ui)) if (name.endsWith(`/${component}`)) return { [component]: stub };
    if (name.endsWith("product-doc-taxonomy")) return { emptyProductDocTaxonomy };
    if (name.endsWith("product-doc-properties")) return { emptyProductDocProperties };
    if (name.endsWith("/copy")) return { productDocsCopy };
    if (name.endsWith("draft-buffer")) return { productDocDraftKey };
    if (name.endsWith("useBufferedProductDocDraft")) return { useBufferedProductDocDraft };
    if (name.endsWith("productDocSaveError")) return { productDocSaveError };
    if (name.endsWith("productDocTitleHighlights")) return { changeTitleHighlights, trimTitleHighlights };
    if (name.endsWith("useProductDocMarkdownImport")) return { useProductDocMarkdownImport: () => ({ readingFile: { current: false }, importInput: { current: null } }) };
    if (name.endsWith("productDocMarkdown")) return { sectionsToEditorMarkdown: () => "Current draft" };
    if (name.endsWith(".css")) return { default: {} };
    throw new Error(`Unexpected draft dependency ${name}`);
  } });
  return module.exports as typeof import("../ProductDocDraft");
}

async function beginPublish(t: TestContext) {
  let resolve!: (value: { version: number }) => void;
  let reject!: (error: unknown) => void;
  let attempts = 0;
  const pending = new Promise<{ version: number }>((yes, no) => { resolve = yes; reject = no; });
  const api = { async publish(requestScope, docId, input) {
    assert.deepEqual(requestScope, scope);
    assert.equal(docId, "doc");
    assert.equal(JSON.stringify(input), '{"expectedDraftVersion":2}');
    attempts++;
    return pending;
  } } satisfies Pick<ProductDocsApi, "publish">;
  const { ProductDocDraft } = loadDraft();
  function Editing() {
    const [published, setPublished] = React.useState(false);
    return published ? <article>Published workflow</article> : <ProductDocDraft api={api as ProductDocsApi} scope={scope} document={document}
      copy={productDocsCopy("en")} locale="en" projectName="Project" drafts={new Map()} onSaved={() => {}} onClose={() => {}}
      onPublished={() => setPublished(true)} />;
  }
  let renderer!: ReactTestRenderer;
  t.after(() => act(() => renderer.unmount()));
  await act(async () => { renderer = create(<Editing />); });
  await act(async () => renderer.root.findByType(ui.DraftActions as Host).props.onSave(true));
  assert.equal(renderer.root.findByType(ui.ProductDocPublishPreview as Host).props.version, 2);
  await act(async () => renderer.root.findByType(ui.ProductDocPublishPreview as Host).props.onPublish(2));
  return { renderer, resolve, reject, attempts: () => attempts };
}

test("a fresh Untitled draft retains lifecycle actions while save and publish are unavailable", async t => {
  const { ProductDocDraft } = loadDraft();
  const api = {} as ProductDocsApi, drafts = new Map(), copy = productDocsCopy("en");
  const fresh: ProductDocDetail = { ...document, title: copy.untitledPage, sections: [], draftVersion: 1,
    lifecycleVersion: 1, publishedVersion: null, canArchive: true, canDelete: true };
  let renderer!: ReactTestRenderer;
  t.after(() => act(() => renderer.unmount()));
  await act(async () => { renderer = create(<ProductDocDraft api={api} scope={scope} document={fresh} copy={copy} locale="en"
    projectName="Project" drafts={drafts} lifecycle={{ api, scope, copy, locale: "en", drafts, onCompleted() {}, onChanged() {} }}
    onSaved={() => {}} onClose={() => {}} onPublished={() => {}} />); });
  const actions = renderer.root.findByType(ui.DraftActions as Host).props;
  assert.equal(actions.canSave, false); assert.equal(actions.canSubmit, false);
  assert.equal(actions.lifecycle.type, ui.ProductDocItemMenu);
  assert.equal(actions.lifecycle.props.node, fresh);
  assert.equal(actions.lifecycle.props.permissions.canArchive, true);
  assert.equal(actions.lifecycle.props.disabled, false);
});

test("publish confirmation stays mounted and busy until publication replaces the editor", async t => {
  const { renderer, resolve } = await beginPublish(t);
  assert.equal(renderer.root.findAllByType(ui.ProductDocPublishPreview as Host).length, 1, "review must not expose the editor during the request");
  assert.equal(renderer.root.findByType(ui.ProductDocPublishPreview as Host).props.busy, true);
  await act(async () => resolve({ version: 2 }));
  assert.equal(renderer.root.findAllByType(ui.ProductDocPublishPreview as Host).length, 0);
  assert.equal(renderer.root.findByType("article").children.join(""), "Published workflow");
});

test("a failed publication keeps the same review open and unlocks it for retry", async t => {
  const { renderer, reject, attempts } = await beginPublish(t);
  await act(async () => reject(new Error("Offline")));
  assert.equal(renderer.root.findAllByType(ui.ProductDocPublishPreview as Host).length, 1);
  assert.equal(renderer.root.findByType(ui.ProductDocPublishPreview as Host).props.busy, false);
  assert.equal(renderer.root.findByType(ui.ProductDocPublishPreview as Host).props.version, 2);
  assert.equal(attempts(), 1);
});

test("saving text keeps related-case context on the new draft version and current publication", async t => {
  const { ProductDocDraft } = loadDraft();
  const api = { async save(requestScope, docId, input) {
    assert.deepEqual(requestScope, scope);
    assert.equal(docId, "doc");
    assert.equal(input.expectedDraftVersion, 2);
    assert.equal(input.title, "Updated workflow");
    return { draftVersion: 3 };
  } } satisfies Pick<ProductDocsApi, "save">;
  let renderer!: ReactTestRenderer;
  t.after(() => act(() => renderer.unmount()));
  await act(async () => { renderer = create(<ProductDocDraft api={api as ProductDocsApi} scope={scope} document={document}
    copy={productDocsCopy("en")} locale="en" projectName="Project" drafts={new Map()} onSaved={() => {}} onClose={() => {}} onPublished={() => {}} />); });
  const before = renderer.root.findByType(ui.ProductDocDraftSurface as Host).props.relatedCases;
  act(() => renderer.root.findByType(ui.ProductDocDraftSurface as Host).props.onTitle("Updated workflow"));
  await act(async () => renderer.root.findByType(ui.DraftActions as Host).props.onSave(false));
  const after = renderer.root.findByType(ui.ProductDocDraftSurface as Host).props.relatedCases;
  assert.equal(after.type, before.type);
  assert.equal(after.props.document.id, "doc");
  assert.equal(after.props.document.draftVersion, 3);
  assert.equal(after.props.document.publishedVersion, 1);
});

test("closing a changed document saves its draft before leaving and a failed save keeps editing", async t => {
  const { ProductDocDraft } = loadDraft();
  let saves = 0, closed = 0, failing = true;
  const api = { async save() { saves++; if (failing) throw new Error("Offline"); return { draftVersion: 3 }; } } as unknown as ProductDocsApi;
  let renderer!: ReactTestRenderer;
  t.after(() => act(() => renderer.unmount()));
  await act(async () => { renderer = create(<ProductDocDraft api={api} scope={scope} document={document}
    copy={productDocsCopy("en")} locale="en" projectName="Project" drafts={new Map()} onSaved={() => {}}
    onClose={() => { closed++; }} onPublished={() => {}} />); });
  act(() => renderer.root.findByType(ui.ProductDocDraftSurface as Host).props.onTitle("Latest workflow"));
  await act(async () => renderer.root.findByType(ui.DraftActions as Host).props.onClose());
  assert.equal(saves, 1, "close must attempt saving, never silently discard or only offer discard");
  assert.equal(closed, 0);
  assert.equal(renderer.root.findByType(ui.ProductDocDraftSurface as Host).props.title, "Latest workflow");
  failing = false;
  await act(async () => renderer.root.findByType(ui.DraftActions as Host).props.onClose());
  assert.equal(closed, 1);
});

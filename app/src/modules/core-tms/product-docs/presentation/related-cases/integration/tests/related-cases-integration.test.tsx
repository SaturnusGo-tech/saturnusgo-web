import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { ProductDocsSelectedPage } from "../../../workspace/ProductDocsSelectedPage";
import type { ProductDocArticle } from "../../../article/ProductDocArticle";
import type { ProductDocDraftSurface } from "../../../draft/surface/ProductDocDraftSurface";
import type { ProductDocDetail, ProductDocsApi } from "../../../../domain/product-docs";
import { productDocsCopy } from "../../../../localization/copy";

const scope = { workspaceId: "w", projectId: "p" };
const page: ProductDocDetail = { id: "doc", kind: "page", title: "Article", parentId: null, sections: [],
  canEdit: true, canPublish: true, draftVersion: 4, publishedVersion: 3, version: 3 };

test("reader and draft retain related-case navigation in their Properties slot", () => {
  const h = componentHarness();
  const { ProductDocsSelectedPage: render } = h.load<{ ProductDocsSelectedPage: typeof ProductDocsSelectedPage }>(
    new URL("../../../workspace/ProductDocsSelectedPage.tsx", import.meta.url));
  const onOpenCase = () => {};
  const props = { api: {} as ProductDocsApi, scope, locale: "en" as const, copy: productDocsCopy("en"), page,
    selection: { docId: "doc" }, editing: false, projectName: "Project", drafts: new Map(),
    editorActionsRef: { current: null }, requestNewPageRef: { current: null }, refresh: 0, canEdit: true, starred: [],
    onCloseDraft() {}, onSaved() {}, onOpen() {}, onSelectSection() {}, onOpenCase };
  const reader = nodes(h.render(() => render(props))).find(node => node.type === "ProductDocArticle")!;
  const slot = reader.props.relatedCases as { type: string; props: Record<string, unknown> };
  assert.equal(slot.type, "ProductDocRelatedCases");
  assert.equal(slot.props.document, page);
  assert.equal(slot.props.onOpenCase, onOpenCase);
  const draft = nodes(h.render(() => render({ ...props, editing: true }))).find(node => node.type === "ProductDocDraft")!;
  assert.equal(draft.props.onOpenCase, onOpenCase);
  h.dispose();
});

test("article and editor surface put the same Related Cases control into the Properties panel", () => {
  const h = componentHarness();
  const { ProductDocArticle: article } = h.load<{ ProductDocArticle: typeof ProductDocArticle }>(new URL("../../../article/ProductDocArticle.tsx", import.meta.url));
  const relatedCases = "related-case-control";
  const reader = nodes(h.render(() => article({ document: page, scope, locale: "en", projectName: "Project", copy: productDocsCopy("en"), relatedCases })));
  assert.equal(reader.find(node => node.type === "ProductDocPropertiesPanel")?.props.relatedCases, relatedCases);
  h.dispose();
  const editor = componentHarness();
  const { ProductDocDraftSurface: surface } = editor.load<{ ProductDocDraftSurface: typeof ProductDocDraftSurface }>(
    new URL("../../../draft/surface/ProductDocDraftSurface.tsx", import.meta.url), name => name === "next/dynamic" ? { default: () => "RichProductSection", __esModule: true } : undefined);
  const output = nodes(editor.render(() => surface({ document: page, scope, locale: "en", projectName: "Project", copy: productDocsCopy("en"),
    relatedCases, title: "Article", titleHighlights: [], taxonomy: { productGroup: null, product: null }, properties: { assignee: null, labels: [], priority: null }, busy: false,
    isFreshPage: false, editorSeed: { markdown: "", epoch: 0 }, editorRef: { current: null }, importInput: { current: null }, withinLimits: true,
    validMarkup: true, error: "", onChange() {}, onValidity() {}, onImport() {}, async onImportText() {}, onMediaBusy() {}, onTitle() {},
    onHighlight() {}, onFolderSave() {}, onTaxonomy() {}, onProperties() {}, onRecover() {} })));
  assert.equal(output.find(node => node.type === "ProductDocPropertiesPanel")?.props.relatedCases, relatedCases);
  editor.dispose();
});

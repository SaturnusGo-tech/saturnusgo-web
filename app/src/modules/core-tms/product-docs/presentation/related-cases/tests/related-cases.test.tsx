import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { ProductDocRelatedCases } from "../ProductDocRelatedCases";
import type { ProductDocDetail, ProductDocsApi } from "../../../domain/product-docs";

const cases = ["a", "b", "c"].map(caseId => ({ caseId, title: `Case ${caseId}`, sectionId: null }));
const document = { id: "doc", title: "Article", canEdit: true, draftVersion: 3, publishedVersion: 2 } as ProductDocDetail;

test("property previews two distinct case links and count opens all related cases", () => {
  const h = componentHarness();
  const opened: Array<{ projectId: string; caseId: string }> = [];
  const { ProductDocRelatedCases: render } = h.load<{ ProductDocRelatedCases: typeof ProductDocRelatedCases }>(
    new URL("../ProductDocRelatedCases.tsx", import.meta.url), name => name.endsWith("useProductDocRelatedCases")
      ? { useProductDocRelatedCases: () => ({ status: "ready", data: cases, retry() {} }) } : undefined);
  const props = { api: {} as ProductDocsApi, scope: { workspaceId: "w", projectId: "p" }, document,
    locale: "en" as const, onOpenCase: (location: { projectId: string; caseId: string }) => opened.push(location) };
  const read = () => nodes(h.render(() => render(props)));
  const all = read();
  const links = all.filter(node => node.props["data-related-case-link"]);
  assert.equal(links.length, 2);
  (links[1].props.onClick as () => void)();
  assert.equal(opened[0].projectId, "p");
  assert.equal(opened[0].caseId, "b");
  const count = all.find(node => node.props["aria-label"] === "Show all related cases: 3");
  assert.ok(count);
  (count.props.onClick as () => void)();
  assert.equal(read().find(node => node.type === "ProductDocRelatedCasesDrawer")?.props.open, true);
  h.dispose();
});

test("empty editable property opens selection while reader stays read only", () => {
  const h = componentHarness();
  const { ProductDocRelatedCases: render } = h.load<{ ProductDocRelatedCases: typeof ProductDocRelatedCases }>(
    new URL("../ProductDocRelatedCases.tsx", import.meta.url), name => name.endsWith("useProductDocRelatedCases")
      ? { useProductDocRelatedCases: () => ({ status: "ready", data: [], retry() {} }) } : undefined);
  const props = { api: {} as ProductDocsApi, scope: { workspaceId: "w", projectId: "p" }, document, locale: "ru" as const };
  const readonly = nodes(h.render(() => render(props)));
  assert.equal(readonly.filter(node => node.props["aria-label"] === "Добавить кейсы или папки").length, 0);
  const editable = nodes(h.render(() => render({ ...props, editable: true })));
  assert.equal(editable.filter(node => node.props["aria-label"] === "Добавить кейсы или папки").length, 1);
  h.dispose();
});

test("unavailable property stays quiet and reopening its full list refreshes the source", () => {
  const h = componentHarness(); let attempts = 0;
  const { ProductDocRelatedCases: render } = h.load<{ ProductDocRelatedCases: typeof ProductDocRelatedCases }>(
    new URL("../ProductDocRelatedCases.tsx", import.meta.url), name => name.endsWith("useProductDocRelatedCases")
      ? { useProductDocRelatedCases: () => ({ status: "error", retry() { attempts++; } }) } : undefined);
  const props = { api: {} as ProductDocsApi, scope: { workspaceId: "w", projectId: "p" }, document, locale: "en" as const };
  const read = () => nodes(h.render(() => render(props)));
  const all = read();
  assert.equal(all.filter(node => node.props.children === "Retry loading").length, 0);
  const heading = all.find(node => node.props["aria-label"] === "Show all related cases");
  assert.ok(heading);
  (heading.props.onClick as () => void)();
  assert.equal(attempts, 1);
  assert.equal(read().find(node => node.type === "ProductDocRelatedCasesDrawer")?.props.open, true);
  h.dispose();
});

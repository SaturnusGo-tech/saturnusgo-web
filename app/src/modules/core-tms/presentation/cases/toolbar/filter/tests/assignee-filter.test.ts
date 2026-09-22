import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { nodes, invoke } from "../../../../../portfolios/tests/support/component-harness";
import { filterCaseRows } from "../../../model/caseListModel";
import type { CaseFilterMenu } from "../../CasesToolbarPopovers";
import type { CaseListRow } from "../../../types";

function menu() {
  let cursor = 0, closeCount = 0; const values: unknown[] = [];
  const module = { exports: {} };
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(ts.transpileModule(readFileSync(new URL("../../CasesToolbarPopovers.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, require: (name: string) => {
    if (name === "react") return { useState: (initial: unknown) => { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (value: unknown) => { values[i] = value; }]; }, useRef: () => ({ current: null }), useEffect() {} };
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name.endsWith("WorkspacePeopleContext")) return { useWorkspacePeople: () => ({ workspaceId: "workspace" }) };
    if (name.endsWith("useFilterPopup")) return { useFilterPopup() {} };
    if (name.endsWith("localization/format/labels")) return { localizedComponentLabel: (_locale: string, value: string) => value };
    return name.endsWith(".css") ? { default: proxy } : proxy;
  } });
  const view = (module.exports as { CaseFilterMenu: typeof CaseFilterMenu }).CaseFilterMenu;
  let facets = { folders: [], components: [], owners: [] } as Parameters<typeof view>[0]["facets"];
  let filters = { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false } as Parameters<typeof view>[0]["filters"];
  const render = (extra: Partial<Parameters<typeof view>[0]> = {}) => { cursor = 0; return nodes(view({ locale: "ru", filters,
    facets, options: { folders: ["/Mobile", "/Web"], components: ["Auth", "Billing"] },
    onFilters: value => { filters = value; }, onFacets: value => { facets = value; }, onClose() { closeCount++; }, ...extra })); };
  const section = (id: string) => invoke(render().find(node => node.props["data-filter-section"] === id)!, "onClick");
  const option = (label: string) => render().find(node => node.props.role === "option" && nodes(node).some(child => child.props.title === label))!;
  return { render, section, option, facets: () => facets, filters: () => filters, closeCount: () => closeCount };
}

test("shared case menus supply an assignee section with multi-selection and a reset", () => {
  const h = menu();
  invoke(h.render().find(node => node.props["data-filter-section"] === "owner")!, "onClick");
  let picker = h.render().find(node => node.type === "RunAssigneeFilter")!;
  assert.equal(picker.props.workspaceId, "workspace");
  invoke(picker, "onChange", "qa1"); picker = h.render().find(node => node.type === "RunAssigneeFilter")!;
  invoke(picker, "onChange", "qa2");
  assert.deepEqual([...h.facets().owners!], ["qa1", "qa2"]);
  invoke(h.render().find(node => node.type === "RunAssigneeFilter")!, "onChange", "qa1");
  assert.deepEqual([...h.facets().owners!], ["qa2"]);
  invoke(h.render().find(node => node.type === "RunAssigneeFilter")!, "onChange", "all");
  assert.equal(h.facets().owners!.length, 0);
});
test("execution menus keep their run assignee semantics without a duplicate repository-owner filter", () => {
  const h = menu(); const items = h.render({ customSectionsOnly: true, extraSections: [{ id: "assignee", label: "Ответственные", summary: "Все", active: false, icon: null, render: () => null }] });
  assert.equal(items.filter(node => node.props["data-filter-section"] === "assignee").length, 1);
  assert.equal(items.some(node => node.props["data-filter-section"] === "owner"), false);
});
test("changing filter categories preserves multi-selection and unrelated case filters", () => {
  const h = menu();
  invoke(h.option("Готово"), "onClick");
  h.section("priority"); invoke(h.option("Высокий"), "onClick");
  h.section("folders");
  invoke(h.option("/Mobile"), "onClick"); invoke(h.option("/Web"), "onClick");
  h.section("components"); invoke(h.option("Auth"), "onClick");
  h.section("folders");
  assert.equal(h.option("/Mobile").props["aria-selected"], true);
  assert.equal(h.option("/Web").props["aria-selected"], true);
  invoke(h.option("/Mobile"), "onClick");
  assert.deepEqual([...h.facets().folders], ["/Web"]);
  assert.deepEqual([...h.facets().components], ["Auth"]);
  assert.equal(h.filters().lifecycle, "ready");
  assert.equal(h.filters().priority, "high");
  assert.equal(h.closeCount(), 0, "choosing options must keep the filter panel open");
});
test("facet search does not alter selection and clears when changing category", () => {
  const h = menu(); h.section("folders");
  invoke(h.option("/Web"), "onClick");
  invoke(h.render().find(node => node.props["aria-label"] === "Поиск папок")!, "onChange", { target: { value: "Mobile" } });
  assert.equal(h.render().filter(node => node.props.role === "option").length, 1);
  assert.deepEqual([...h.facets().folders], ["/Web"]);
  h.section("components");
  assert.equal(h.render().find(node => node.props["aria-label"] === "Поиск компонентов")?.props.value, "");
  assert.equal(h.render().filter(node => node.props.role === "option").length, 2);
});
test("reset clears filters, facets and custom sections without closing the panel", () => {
  const h = menu(); let resetExtra = 0;
  h.section("folders"); invoke(h.option("/Mobile"), "onClick");
  h.section("owner"); invoke(h.render().find(node => node.type === "RunAssigneeFilter")!, "onChange", "qa1");
  h.section("tag");
  invoke(h.render().find(node => node.props["aria-label"] === "Тег")!, "onChange", { target: { value: "release" } });
  invoke(h.render().find(node => node.props.role === "switch")!, "onChange", { target: { checked: true } });
  const reset = h.render({ onResetExtra: () => { resetExtra++; } }).find(node => node.type === "button" && node.props.children === "Сбросить")!;
  invoke(reset, "onClick");
  assert.deepEqual({ ...h.filters() }, { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
  assert.deepEqual(Object.values(h.facets()).map(value => value?.length), [0, 0, 0]);
  assert.equal(resetExtra, 1); assert.equal(h.closeCount(), 0);
});
test("custom-only menus render their selected section and preserve its callback", () => {
  const h = menu(); let selected = "";
  const extra = { customSectionsOnly: true, extraSections: [{ id: "assignee", label: "Ответственные", summary: "Все", active: false, icon: null,
    render: () => ({ type: "RunAssigneeFilter", key: null, props: { onChange: (value: string) => { selected = value; } } }) }] };
  const items = h.render(extra);
  assert.deepEqual(items.filter(node => node.props.role === "tab").map(node => node.props["data-filter-section"]), ["assignee"]);
  invoke(items.find(node => node.type === "RunAssigneeFilter")!, "onChange", "qa1");
  assert.equal(selected, "qa1");
});
test("multiple assignees match cases across projects and combine with component filters", () => {
  const rows = [
    { id: "a", projectId: "p1", ownerIdentityId: "qa1", component: "Auth" },
    { id: "b", projectId: "p2", ownerIdentityId: "qa2", component: "Auth" },
    { id: "c", projectId: "p2", ownerIdentityId: "qa3", component: "Auth" },
    { id: "d", projectId: "p1", ownerIdentityId: "qa2", component: "Billing" },
  ].map(item => ({ testCase: { ...item, tags: [], key: item.id, title: item.id, folderPath: "/", currentRevision: 1, type: "manual", lifecycle: "draft", priority: "medium", estimatedMinutes: null, revisionCount: 1, archivedAt: null, createdAt: "", updatedAt: "", etag: "1" }, folderPath: "/" })) as CaseListRow[];
  const result = filterCaseRows(rows, { facets: { folders: [], components: ["Auth"], owners: ["qa1", "qa2"] } });
  assert.deepEqual(result.map(row => row.testCase.id), ["a", "b"]);
});

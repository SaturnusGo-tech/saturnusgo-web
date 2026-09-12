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
  let cursor = 0; const values: unknown[] = [];
  const module = { exports: {} };
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(ts.transpileModule(readFileSync(new URL("../../CasesToolbarPopovers.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, require: (name: string) => {
    if (name === "react") return { useState: (initial: unknown) => { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (value: unknown) => { values[i] = value; }]; }, useRef: () => ({ current: null }), useEffect() {} };
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name.endsWith("WorkspacePeopleContext")) return { useWorkspacePeople: () => ({ workspaceId: "workspace" }) };
    return name.endsWith(".css") ? { default: proxy } : proxy;
  } });
  const view = (module.exports as { CaseFilterMenu: typeof CaseFilterMenu }).CaseFilterMenu;
  let facets = { folders: [], components: [], owners: [] } as Parameters<typeof view>[0]["facets"];
  const render = (extra: Partial<Parameters<typeof view>[0]> = {}) => { cursor = 0; return nodes(view({ locale: "ru", filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false },
    facets, options: { folders: [], components: [] }, onFilters() {}, onFacets: value => { facets = value; }, onClose() {}, ...extra })); };
  return { render, facets: () => facets };
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

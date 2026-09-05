import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import {
  dynamicGroupBy,
  filterCaseRows,
  flattenCaseGroups,
  groupCaseRows,
  resolveDependentCaseFacets,
  sanitizeDependentCaseFacets,
  visibleCaseTabStop,
} from "../../caseListModel";

function createCase(index: number): TestCaseSummary {
  const folderPath = `/Folder ${Math.floor(index / 60) + 1}`;
  return {
    id: `case-${index}`, projectId: "project-1", key: `TMS-${index}`, folderPath,
    currentRevision: 1, title: `Case ${index}`, type: "manual",
    lifecycle: index % 2 === 0 ? "ready" : "draft", priority: "medium",
    component: index % 2 === 0 ? "Web" : "API", ownerIdentityId: "QA", tags: [],
    estimatedMinutes: index, revisionCount: 1, archivedAt: null,
    createdAt: "2026-08-31T00:00:00.000Z", updatedAt: "2026-08-31T00:00:00.000Z",
    etag: `"case-${index}:1"`,
  };
}

test("applies folder and component facets as OR inside and AND across", () => {
  const rows = flattenCaseGroups([
    ["/Host/Archive", [{ ...createCase(1), component: "Archive" }, { ...createCase(2), component: "Legal" }]],
    ["/Host/Orders", [{ ...createCase(3), component: "Orders" }]],
  ]);
  const filtered = filterCaseRows(rows, { facets: { folders: ["/Host/Archive"], components: ["Archive", "Legal"] } });
  assert.deepEqual(filtered.map((row) => row.testCase.id), ["case-1", "case-2"]);
});

test("keeps folders stable while components follow the selected folder OR-scope", () => {
  const rows = flattenCaseGroups([
    ["/Host/Archive", [{ ...createCase(1), component: "Archive" }, { ...createCase(2), component: "Legal" }]],
    ["/Host/Orders", [{ ...createCase(3), component: "Orders" }]],
  ]);
  assert.deepEqual(resolveDependentCaseFacets(rows, { folders: [], components: ["Archive"] }).folders, ["/Host", "/Host/Archive", "/Host/Orders"]);
  assert.deepEqual(resolveDependentCaseFacets(rows, { folders: ["/Host/Archive"], components: [] }).components, ["Archive", "Legal"]);
  assert.deepEqual(resolveDependentCaseFacets(rows, { folders: ["/Host/Archive", "/Host/Orders"], components: [] }).components, ["Archive", "Legal", "Orders"]);
});

test("sanitizes only components that become incompatible with the stable folder scope", () => {
  const rows = flattenCaseGroups([
    ["/Host/Archive", [{ ...createCase(1), component: "Archive" }, { ...createCase(2), component: "Legal" }]],
    ["/Host/Orders", [{ ...createCase(3), component: "Orders" }]],
  ]);
  assert.deepEqual(sanitizeDependentCaseFacets(rows, {
    folders: ["/Host/Archive"], components: ["Archive", "Orders"],
  }), { folders: ["/Host/Archive"], components: ["Archive"] });
  assert.deepEqual(sanitizeDependentCaseFacets(rows, {
    folders: ["/Host/Archive", "/Host/Orders"], components: ["Archive", "Orders"],
  }), { folders: ["/Host/Archive", "/Host/Orders"], components: ["Archive", "Orders"] });
});

test("offers implicit repository ancestors and keeps subtree boundaries exact", () => {
  const rows = flattenCaseGroups([
    ["/Host/Archive/Errors", [{ ...createCase(1), component: "Archive" }]],
    ["/Host/Archive-old", [{ ...createCase(2), component: "Legacy" }]],
  ]);
  assert.deepEqual(resolveDependentCaseFacets(rows, { folders: [], components: ["Archive"] }).folders, [
    "/Host", "/Host/Archive", "/Host/Archive-old", "/Host/Archive/Errors",
  ]);
  assert.deepEqual(filterCaseRows(rows, { facets: { folders: ["/Host/Archive"], components: [] } }).map((row) => row.testCase.id), ["case-1"]);
});

test("dynamic mode defaults to folder grouping and preserves an explicit facet", () => {
  assert.equal(dynamicGroupBy("none"), "folder");
  assert.equal(dynamicGroupBy("component"), "component");
});

test("keeps one visible row tabbable when selection is filtered or collapsed", () => {
  const rows = flattenCaseGroups([["/A", [createCase(1)]], ["/B", [createCase(2)]]]);
  const groups = groupCaseRows(rows, "folder");
  assert.equal(visibleCaseTabStop(groups, new Set(), "missing"), "case-1");
  assert.equal(visibleCaseTabStop(groups, new Set(["folder:/A"]), "case-1"), "case-2");
  assert.equal(visibleCaseTabStop(groups, new Set(["folder:/A", "folder:/B"]), "case-1"), null);
});

test("toolbar exposes keyboard QL autocomplete and bounded contextual facets", () => {
  const toolbar = readFileSync(new URL("../../../toolbar/CasesToolbar.tsx", import.meta.url), "utf8");
  const popovers = readFileSync(new URL("../../../toolbar/CasesToolbarPopovers.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../../listing/caseListing.module.css", import.meta.url), "utf8");
  assert.match(popovers, /role="combobox"/);
  assert.match(popovers, /aria-autocomplete="list"/);
  assert.match(popovers, /const renderedSuggestions = suggestions\.slice\(0, 10\)/);
  assert.match(popovers, /aria-activedescendant=\{open && renderedSuggestions\[activeIndex\]/);
  assert.match(popovers, /event\.key === "Enter" && open && renderedSuggestions\[activeIndex\]/);
  assert.doesNotMatch(popovers, /suggestions\.slice\(0, 10\)\.map/);
  assert.match(popovers, /event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"/);
  assert.match(popovers, /"ArrowDown", "ArrowUp", "Home", "End"/);
  assert.match(popovers, /data-filter-section="folders"/);
  assert.match(popovers, /returnSectionRef/);
  assert.match(popovers, /status: "lifecycle"/);
  assert.match(popovers, /role="listbox" aria-multiselectable=/);
  assert.match(popovers, /Поиск папок/);
  assert.match(popovers, /Поиск компонентов/);
  assert.match(css, /\.filterPanel \{[^}]*max-height: min\(362px/s);
  assert.match(css, /\.facetOptions \{[^}]*max-height: 244px/s);
  assert.doesNotMatch(toolbar, /filterField|facetList/);
});

test("toolbar keeps subtle focus and editor-locked create actions", () => {
  const toolbar = readFileSync(new URL("../../../toolbar/CasesToolbar.tsx", import.meta.url), "utf8");
  const table = readFileSync(new URL("../../../list/CasesTable.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../../listing/caseListing.module.css", import.meta.url), "utf8");
  const bulkCss = readFileSync(new URL("../../../bulk/styles/caseBulk.module.css", import.meta.url), "utf8");
  const inputFocus = css.match(/\.inputShell:focus-within \{([^}]*)\}/)?.[1] ?? "";
  assert.match(inputFocus, /border-color: var\(--cases-primary\)/); assert.match(inputFocus, /box-shadow: none/);
  assert.match(toolbar, /aria-disabled=\{props\.interactionLocked \|\| undefined\}/); assert.match(toolbar, /guardCreateInteraction/);
  assert.match(toolbar, /role="menuitem"/); assert.match(toolbar, /Выбрать тест-кейсы|Select test cases/);
  assert.match(toolbar, /aria-pressed=\{props\.selectionMode\}/); assert.match(table, /props\.selectionMode \? <CaseSelectionHeader/); assert.match(table, /props\.selectionMode && <CaseSelectionCheckbox/);
  assert.match(css, /\.selectionColumn \{ width: 0; transition:/); assert.match(css, /\.selectionMode \.selectionColumn \{ width: 34px; \}/);
  assert.match(bulkCss, /animation: bulkBarReveal 220ms/); assert.match(bulkCss, /clip-path: inset\(0 0 100% 0\)/);
  assert.match(css, /\.filterActive \{ position: relative;/); assert.match(css, /\.filterActive b \{[^}]*position: absolute;[^}]*border-radius: 999px/s);
  assert.match(toolbar, /aria-hidden="true">\{activeFilterCount\}/);
});

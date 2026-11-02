import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../../folders/model/folder";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { SuiteRepository } from "../SuiteRepository";

const item = { id: "case-a", projectId: "project-a", key: "WEB-TC-3", title: "Confirm a booking", folderId: "folder-a", folderPath: "/Old name", lifecycle: "ready", archivedAt: null } as TestCaseSummary;
test("case navigation retains current folder context and reuses the saved membership search", () => {
  const h = componentHarness(); const opened: string[] = []; const saves: unknown[] = [];
  const saved = { query: "booking", qlQuery: "priority = high", filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false }, facets: { folders: [], components: [] } };
  const state = { ...saved, visible: [item], setQuery() {}, setQlQuery() {}, setFilters() {}, setFacets() {} };
  let initial: unknown;
  const { SuiteRepository: View } = h.load<{ SuiteRepository: typeof SuiteRepository }>(new URL("../SuiteRepository.tsx", import.meta.url), name =>
    name.endsWith("useNavigationValue") ? { useNavigationValue: (key: string) => { assert.equal(key, "suite:suite-a:repository"); return [saved, (value: unknown) => saves.push(value)]; } }
      : name.endsWith("SelectionControls") ? { SelectionControls: "SelectionControls", useSelectionFilters: (_cases: TestCaseSummary[], value: unknown) => { initial = value; return state; } } : undefined);
  const folders = [{ id: "folder-a", projectId: "project-a", path: "/Reservations/Checkout" }, { id: "folder-a", projectId: "foreign", path: "/Wrong project" }] as RepositoryFolder[];
  const all = nodes(h.render(() => View({ suiteId: "suite-a", cases: [item], folders, projectName: "Host", ru: false, onOpen: value => opened.push(value.id) })));
  assert.equal(initial, saved); assert.equal(saves.length, 1);
  const path = all.find(node => node.type === "SuiteFolderPath")!;
  assert.equal(path.props.path, "/Reservations/Checkout"); assert.equal(path.props.unavailable, false);
  assert.equal(all.some(node => node.type === "PiListChecks"), true);
  assert.equal(all.find(node => node.type === "LifecycleBadge")!.props.lifecycle, "ready");
  assert.equal(all.find(node => node.type === "SelectionControls")!.props.repository, true);
  invoke(all.find(node => node.props["aria-label"] === "WEB-TC-3: Confirm a booking")!, "onClick");
  assert.deepEqual(opened, ["case-a"]); h.dispose();
});
test("empty filtered membership offers one reset for search, QL and advanced filters", () => {
  const h = componentHarness(); const calls: string[] = [];
  const state = { query: "missing", qlQuery: "priority = critical", filters: {}, facets: {}, visible: [],
    setQuery: (value: string) => calls.push(`query:${value}`), setQlQuery: (value: string) => calls.push(`ql:${value}`),
    setFilters: (value: unknown) => calls.push(`filters:${JSON.stringify(value)}`), setFacets: (value: unknown) => calls.push(`facets:${JSON.stringify(value)}`) };
  const { SuiteRepository: View } = h.load<{ SuiteRepository: typeof SuiteRepository }>(new URL("../SuiteRepository.tsx", import.meta.url), name =>
    name.endsWith("useNavigationValue") ? { useNavigationValue: () => [{}, () => {}] }
      : name.endsWith("SelectionControls") ? { SelectionControls: "SelectionControls", useSelectionFilters: () => state } : undefined);
  const all = nodes(h.render(() => View({ suiteId: "suite-a", cases: [item], folders: [], projectName: "Host", ru: false, onOpen() {} })));
  invoke(all.find(node => node.type === "button" && node.props.children === "Reset search and filters")!, "onClick");
  assert.deepEqual(calls, ["query:", "ql:", 'filters:{"type":"all","priority":"all","lifecycle":"all","tag":"","includeArchived":false}', 'facets:{"folders":[],"components":[]}']); h.dispose();
});
test("compact membership preserves case order and distinguishes root from unavailable folder identity", () => {
  const h = componentHarness(); const opened: string[] = [];
  const cases = [{ ...item, id: "root", key: "WEB-TC-8", folderId: null, folderPath: "/", priority: "low" },
    { ...item, id: "missing", key: "WEB-TC-2", priority: "critical", archivedAt: "2026-11-01" }] as TestCaseSummary[];
  const state = { query: "", qlQuery: "", filters: {}, facets: {}, visible: cases, setQuery() {}, setQlQuery() {}, setFilters() {}, setFacets() {} };
  const { SuiteRepository: View } = h.load<{ SuiteRepository: typeof SuiteRepository }>(new URL("../SuiteRepository.tsx", import.meta.url), name =>
    name.endsWith("useNavigationValue") ? { useNavigationValue: () => [{}, () => {}] }
      : name.endsWith("SelectionControls") ? { SelectionControls: "SelectionControls", useSelectionFilters: () => state } : undefined);
  const all = nodes(h.render(() => View({ suiteId: "suite-a", cases, folders: [], projectName: "Host", ru: false, onOpen: value => opened.push(value.id) })));
  const paths = all.filter(node => node.type === "SuiteFolderPath");
  assert.equal(paths[0].props.path, "/"); assert.equal(paths[0].props.unavailable, false);
  assert.equal(paths[1].props.path, "/Old name"); assert.equal(paths[1].props.unavailable, true);
  assert.deepEqual(all.filter(node => node.type === "PrioritySignal").map(node => node.props.priority), ["low", "critical"]);
  assert.deepEqual(all.filter(node => node.type === "LifecycleBadge").map(node => node.props.archived), [false, true]);
  all.filter(node => node.type === "button" && typeof node.props["aria-label"] === "string").forEach(node => invoke(node, "onClick"));
  assert.deepEqual(opened, ["root", "missing"]); h.dispose();
});

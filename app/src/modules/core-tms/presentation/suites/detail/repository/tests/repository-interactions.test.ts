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
  assert.equal(all.find(node => node.props.title === "Host / Reservations / Checkout") !== undefined, true);
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

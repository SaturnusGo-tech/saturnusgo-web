import assert from "node:assert/strict";
import test from "node:test";
import type { RunRepositoryBrowser } from "../RunRepositoryBrowser";
import type { SelectionControls } from "../../../cases/selection/controls/SelectionControls";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

function browser() {
  const h = componentHarness(); const selected: string[][] = [];
  const { RunRepositoryBrowser: render } = h.load<{ RunRepositoryBrowser: typeof RunRepositoryBrowser }>(new URL("../RunRepositoryBrowser.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("run-repository")) return { runRepositoryFolders: () => [] };
  });
  const props = { model: { connection: "connected", data: { meta: { authorization: { capabilities: ["run:manage"] } }, workspace: { id: "w" } } },
    repository: { browser: { choices: [] }, rows: [], run: { status: "active" }, cases: [], visible: [{ id: "a" }, { id: "b" }],
      assignments: { selecting: false, selected: new Set(), toggleScope: (ids: string[]) => selected.push(ids) }, runFilters: { sections: [] },
      filters: { filters: {} }, groups: [{ id: "p1", label: "Project one", cases: [{ id: "a" }] }, { id: "p2", label: "Project two", cases: [{ id: "b" }] }], lookup: new Map() },
    lifecycleBlocked: false } as unknown as Parameters<typeof RunRepositoryBrowser>[0];
  const all = () => nodes(h.render(() => render(props)));
  const headings = () => all().filter(node => node.type === "SelectionTree").flatMap(node => nodes(node.props.heading));
  return { props, all, headings, selected };
}

test("run selection commands stay mounted and inaccessible until selection mode is enabled", () => {
  const h = browser();
  let groups = h.headings().filter(node => node.props.role === "group");
  assert.equal(groups.length, 2);
  for (const group of groups) {
    const element = { inert: false }; invoke(group, "ref", element);
    assert.equal(element.inert, true); assert.equal(group.props["aria-hidden"], true);
    assert.equal(nodes(group).find(node => node.type === "button")?.props.disabled, true);
  }
  h.props.repository.assignments.selecting = true;
  groups = h.headings().filter(node => node.props.role === "group");
  for (const group of groups) {
    const element = { inert: true }; invoke(group, "ref", element);
    assert.equal(element.inert, false); assert.equal(group.props["aria-hidden"], false);
  }
  const first = nodes(groups[0]).find(node => node.type === "button")!; invoke(first, "onClick");
  assert.deepEqual(h.selected.map(ids => Array.from(ids)), [["a"]], "Select all must use the adjacent project's visible cases");
  h.props.lifecycleBlocked = true;
  assert.ok(h.headings().filter(node => node.type === "button").every(node => node.props.disabled));
});

test("runs expose the selection toggle in repository controls and no refresh action", () => {
  const h = browser(); const controls = h.all().find(node => node.type === "SelectionControls")!;
  assert.equal(controls.props.repository, true); assert.equal(controls.props.onSelectAll, undefined);
  const action = nodes(controls.props.action).find(node => node.type === "button")!;
  assert.equal(action.props["aria-label"], "Select test cases");
  assert.equal(controls.props.tools, undefined);
  assert.equal(h.all().some(node => node.props["aria-label"] === "Refresh"), false);
});

test("repository control placement preserves run-creation and suite selection actions", () => {
  for (const repository of [false, true]) {
    const h = componentHarness(); let selected = 0;
    const { SelectionControls: render } = h.load<{ SelectionControls: typeof SelectionControls }>(new URL("../../../cases/selection/controls/SelectionControls.tsx", import.meta.url), name =>
      name.endsWith("case-field-filters") ? { fieldFilterCount: () => 0 } : undefined);
    const props = { repository, ru: false, onSelectAll: () => selected++, state: { query: "", qlQuery: "", options: { folders: [], components: [], tags: [] }, directory: { items: [] }, facets: { folders: [], components: [] }, filters: { type: "all", priority: "all", lifecycle: "all" } } } as unknown as Parameters<typeof SelectionControls>[0];
    const all = nodes(h.render(() => render(props)));
    const search = all.find(node => node.props["data-input-shell"] === true)!;
    assert.equal(nodes(search).some(node => node.props["aria-label"] === "QL query"), repository);
    assert.equal(nodes(search).some(node => node.props["aria-label"] === "Filters"), repository);
    const selectAll = all.find(node => node.type === "button" && node.props.children === "Select all");
    assert.equal(Boolean(selectAll), !repository);
    if (selectAll) { invoke(selectAll, "onClick"); assert.equal(selected, 1); }
  }
});

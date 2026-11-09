import assert from "node:assert/strict";
import test from "node:test";
import type { RunRepositoryBrowser } from "../RunRepositoryBrowser";
import type { RunRepositoryHeader } from "../header/RunRepositoryHeader";
import { isWorkingRun } from "../../../../runs/model/history/run-history";
import type { SelectionControls } from "../../../cases/selection/controls/SelectionControls";
import type { RepositoryQueryControls } from "../../../cases/browser/controls/RepositoryQueryControls";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

function browser() {
  const h = componentHarness(); const selected: string[][] = [];
  const { RunRepositoryBrowser: render } = h.load<{ RunRepositoryBrowser: typeof RunRepositoryBrowser }>(new URL("../RunRepositoryBrowser.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useRunFolderAppearance")) return { useRunFolderAppearance: () => [] };
    if (name.endsWith("run-repository")) return { runRepositoryFolders: () => [] };
    if (name.endsWith("run-history")) return { isWorkingRun };
  });
  const props = { model: { connection: "connected", data: { meta: { authorization: { capabilities: ["run:manage"] } }, workspace: { id: "w" } } },
    repository: { browser: { choices: [], ready: true }, rows: [], run: { status: "active" }, cases: [], visible: [{ id: "a" }, { id: "b" }],
      assignments: { selecting: false, selected: new Set(), toggleScope: (ids: string[]) => selected.push(ids) }, runFilters: { sections: [] },
      filters: { filters: {}, options: { tags: [] } }, groups: [{ id: "p1", label: "Project one", cases: [{ id: "a" }] }, { id: "p2", label: "Project two", cases: [{ id: "b" }] }], lookup: new Map() },
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

test("run selection is the trailing group action, separate from the shared repository query controls", () => {
  const h = browser();
  assert.ok(h.all().filter(node => node.type === "SelectionTree").every(node => node.props.titleMode === "marquee"));
  const controls = h.all().find(node => node.type === "RepositoryQueryControls")!;
  assert.equal(controls.props.compact, true);
  assert.equal(controls.props.customSectionsOnly, true);
  assert.equal(controls.props.action, undefined);
  const actions = h.headings().filter(node => node.props["aria-label"] === "Select test cases");
  assert.equal(actions.length, 1);
  assert.equal(actions[0].props.children, "Select");
  h.props.repository.assignments.selecting = true;
  assert.equal(h.headings().find(node => node.props["aria-label"] === "Select test cases")?.props.children, "Done");
  assert.equal(h.all().some(node => node.props["aria-label"] === "Refresh"), false);
});

test("the shared repository search closes QL while showing the HeroUI filters, and vice versa", () => {
  const h = componentHarness(undefined, { requestAnimationFrame() {} });
  const { RepositoryQueryControls: render } = h.load<{ RepositoryQueryControls: typeof RepositoryQueryControls }>(
    new URL("../../../cases/browser/controls/RepositoryQueryControls.tsx", import.meta.url), name => {
      if (name.endsWith("case-field-filters")) return { fieldFilterCount: () => 0 };
      return undefined;
    });
  const props = { locale: "en", query: "", qlQuery: "key:HOST-1", tags: [], directory: { items: [] },
    facets: { folders: [], components: [] }, options: { folders: [], components: [] }, filterOpen: false,
    filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false },
    onFilterOpen(value: boolean) { props.filterOpen = value; } } as unknown as Parameters<typeof render>[0];
  const view = () => nodes(h.render(() => render(props)));
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, true);
  invoke(view().find(node => node.type === "Popover")!, "onOpenChange", true);
  assert.ok(view().some(node => node.type === "CaseFilterMenu"));
  assert.ok(!view().some(node => node.type === "CaseQlAutocomplete"));
  invoke(view().find(node => node.props["aria-label"] === "QL query")!, "onPress");
  assert.ok(!view().some(node => node.type === "CaseFilterMenu"));
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, true);
  assert.equal(props.qlQuery, "key:HOST-1");
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

test("same-scope background reload keeps repository trees and active identity mounted but locks interaction", () => {
  const h = browser();
  h.props.model.selectedRunItemId = "b";
  h.props.repository.browser.loading = true;
  const all = h.all(), trees = all.filter(node => node.type === "SelectionTree");
  assert.equal(trees.length, 2, "the confirmed folder trees must survive a background reload");
  assert.equal(all.some(node => node.type === "RunCasesSkeleton"), false);
  assert.equal(all.find(node => node.type === "RepositoryQueryControls")?.props.disabled, true);
  assert.equal(all.find(node => node.type === "RunRepositoryHeader")?.props.disabled, false, "run navigation remains available during a read refresh");
  assert.equal(all.find(node => node.type === "RunRepositoryHeader")?.props.actionsDisabled, true);
  assert.ok(trees.every(node => node.props.disabled && node.props.activeId === "b"));
  h.props.repository.browser.loading = false; h.props.repository.browser.ready = false;
  assert.equal(h.all().filter(node => node.type === "SelectionTree").length, 2);
  assert.equal(h.all().find(node => node.type === "RepositoryQueryControls")?.props.disabled, true, "the revision changes before its loading effect runs");
});

test("initial repository load uses skeleton without an empty-state flash", () => {
  const h = browser();
  h.props.repository.browser.loading = true; h.props.repository.groups = []; h.props.repository.visible = [];
  const all = h.all();
  assert.equal(all.filter(node => node.type === "RunCasesSkeleton").length, 1);
  assert.equal(all.some(node => node.type === "SelectionTree"), false);
  assert.equal(all.some(node => node.props.className === "empty"), false);
});


test("failed repository reads keep the run chooser and creation available while lifecycle actions stay locked", () => {
  const h = browser(); const chosen: string[] = []; let created = 0;
  h.props.model.setProjectId = id => chosen.push(`project:${id}`);
  h.props.model.setSelectedRunId = value => { chosen.push(`run:${value}`); };
  h.props.model.setSelectedRunItemId = value => { chosen.push(`item:${value}`); };
  h.props.model.openRunDialog = () => { created++; };
  h.props.repository.browser.ready = false; h.props.repository.browser.error = "Read failed";
  h.props.repository.browser.choices = [{ id: "other", name: "Other run", tags: [], runs: [{ id: "other", projectId: "p2", status: "draft", archivedAt: null }] }] as never;
  const all = h.all(), header = all.find(node => node.type === "RunRepositoryHeader")!;
  assert.equal(header.props.disabled, false); assert.equal(header.props.actionsDisabled, true);
  assert.equal(header.props.onEdit, undefined);
  invoke(header, "onChoose", "other"); invoke(header, "onCreate");
  assert.deepEqual(chosen, ["project:p2", "run:other", "item:null"]); assert.equal(created, 1);
  assert.equal(all.find(node => node.type === "RepositoryQueryControls")?.props.disabled, true);
  assert.ok(all.filter(node => node.type === "SelectionTree").every(node => node.props.disabled));
});

test("header lifecycle lock does not block recovery navigation or New run", () => {
  const h = componentHarness();
  const { RunRepositoryHeader: View } = h.load<{ RunRepositoryHeader: typeof RunRepositoryHeader }>(new URL("../header/RunRepositoryHeader.tsx", import.meta.url), name => {
    if (name === "framer-motion") return { useReducedMotion: () => true, AnimatePresence: "AnimatePresence", motion: { button: "button" } };
  });
  const props = { ru: false, run: { status: "active", archivedAt: null }, choices: [], value: "r", disabled: false, actionsDisabled: true, startBlocked: false, canManage: true,
    onChoose() {}, onCreate() {}, onAction() {} } as unknown as Parameters<typeof View>[0];
  const all = nodes(h.render(() => View(props)));
  assert.equal(all.find(node => node.type === "RunSelector")?.props.disabled, false);
  assert.equal(all.find(node => node.props.className === "newRun")?.props.disabled, false);
  assert.equal(all.find(node => node.props["aria-label"] === "Pause run")?.props.disabled, true);
  assert.equal(all.find(node => node.props["aria-label"] === "Complete run")?.props.disabled, true);
});

test("impact approval blocks starting a draft but permits resuming a paused run", () => {
  const h = componentHarness();
  const { RunRepositoryHeader: View } = h.load<{ RunRepositoryHeader: typeof RunRepositoryHeader }>(new URL("../header/RunRepositoryHeader.tsx", import.meta.url), name => {
    if (name === "framer-motion") return { useReducedMotion: () => true, AnimatePresence: "AnimatePresence", motion: { button: "button" } };
  });
  const props = { ru: false, choices: [], value: "r", disabled: false, startBlocked: true, canManage: true,
    onChoose() {}, onCreate() {}, onAction() {} } as Parameters<typeof View>[0];
  const lifecycleButton = (status: "draft" | "paused", label: string) => {
    const run = { status, archivedAt: null } as Parameters<typeof View>[0]["run"];
    return nodes(h.render(() => View({ ...props, run }))).find(node => node.props["aria-label"] === label)?.props.disabled;
  };
  assert.equal(lifecycleButton("draft", "Start run"), true);
  assert.equal(lifecycleButton("paused", "Resume run"), false);
});

test("the HeroUI run filter forwards selection, deselection and All without replacing the run filter state", () => {
  const h = componentHarness();
  const { RunFilterOptions: render } = h.load<typeof import("../../filters/options/RunFilterOptions")>(
    new URL("../../filters/options/RunFilterOptions.tsx", import.meta.url));
  const changed: string[] = [];
  const options = [{ value: "all", label: "All" }, { value: "passed", label: "Passed" }, { value: "failed", label: "Failed" }];
  const choose = (selected: string[], keys: string[]) => invoke(
    nodes(h.render(() => render({ label: "Results", popover: true, multiple: true, options, selected,
      onChange: value => changed.push(value) }))).find(node => node.type === "Listbox")!,
    "onSelectionChange", new Set(keys));
  choose(["all"], ["all", "passed"]);
  choose(["passed", "failed"], ["failed"]);
  choose(["failed"], ["all", "failed"]);
  assert.deepEqual(changed, ["passed", "passed", "all"]);
});

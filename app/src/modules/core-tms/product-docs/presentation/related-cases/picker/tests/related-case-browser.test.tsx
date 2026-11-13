import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes, invoke } from "../../../../../portfolios/tests/support/component-harness";
import { pickerSelection } from "../../../../../presentation/dialogs/suite/picker/model/picker-model";
import { fieldFilterCount } from "../../../../../presentation/cases/model/fields/case-field-filters";
import { relatedCaseView } from "../model/related-case-view";
import type { RelatedCaseBrowser } from "../RelatedCaseBrowser";
import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../../folders/model/folder";

function setup() {
  const h = componentHarness();
  const cases = [{ id: "a", key: "QA-1", title: "Title A", folderId: "f", folderPath: "/Folder", archivedAt: null },
    { id: "b", key: "QA-2", title: "Title B", folderId: null, folderPath: "/", archivedAt: null }] as TestCaseSummary[];
  const folders = [{ id: "f", path: "/Folder", name: "Folder", parentId: null, archivedAt: null }] as RepositoryFolder[];
  const state = { query: "", setQuery(value: string) { state.query = value; }, qlQuery: "", setQlQuery(value: string) { state.qlQuery = value; },
    filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false }, setFilters() {},
    facets: { folders: [], components: [] }, setFacets() {}, options: { tags: [] }, visible: cases, directory: { items: [], members: [] } };
  const { RelatedCaseBrowser: render } = h.load<{ RelatedCaseBrowser: typeof RelatedCaseBrowser }>(new URL("../RelatedCaseBrowser.tsx", import.meta.url), name =>
    name.endsWith("SelectionControls") ? { useSelectionFilters: () => state }
      : name.endsWith("related-case-view") ? { relatedCaseView }
        : name.endsWith("picker-model") ? { pickerSelection }
          : name.endsWith("case-field-filters") ? { fieldFilterCount }
            : name === "framer-motion" ? { useReducedMotion: () => false, motion: { div: "motion.div" }, AnimatePresence: "AnimatePresence" } : undefined);
  let selected = new Set<string>(); const scopes: readonly string[][] = [];
  const props = { cases, folders, projectName: "Project", ru: false, disabled: false, onToggle() {}, onScope(ids: readonly string[]) { (scopes as string[][]).push([...ids]); } };
  const read = (disabled = false) => nodes(h.render(() => render({ ...props, selected, disabled })));
  return { h, state, cases, read, scopes, select(ids: string[]) { selected = new Set(ids); } };
}

test("related-case browsing uses the exact repository controls including QL and all filter state", t => {
  const s = setup(); t.after(s.h.dispose);
  const controls = s.read().find(node => node.type === "RepositoryQueryControls")!;
  assert.ok(controls);
  assert.equal(controls.props.filters, s.state.filters);
  assert.equal(controls.props.facets, s.state.facets);
  assert.equal(controls.props.onQlQuery, s.state.setQlQuery);
  assert.equal(controls.props.onQuery, s.state.setQuery);
  assert.equal(controls.props.disabled, false);
  assert.equal(s.read(true).find(node => node.type === "RepositoryQueryControls")!.props.disabled, true);
  assert.equal(s.read().some(node => node.type === "PriorityFilter"), false);
});

test("Selected has no active zero-count state, reveals on selection and resets after removing its last item", t => {
  const s = setup(); t.after(s.h.dispose);
  const action = () => {
    const controls = s.read().find(node => node.type === "RepositoryQueryControls")!;
    return nodes(controls.props.actions);
  };
  assert.equal(action()[0].props["aria-hidden"], true);
  assert.equal(action().find(node => node.type === "Button")!.props.isDisabled, true);
  s.select(["a"]);
  assert.equal(action()[0].props["data-open"], true);
  invoke(action().find(node => node.type === "Button")!, "onPress");
  assert.deepEqual((s.read().find(node => node.type === "PickerRows")!.props.cases as TestCaseSummary[]).map(value => value.id), ["a"]);
  s.select([]); s.read();
  assert.equal(action()[0].props["aria-hidden"], true);
  assert.equal(s.read().find(node => node.type === "PickerRows")!.props.cases instanceof Array, true);
  assert.equal((s.read().find(node => node.type === "PickerRows")!.props.cases as TestCaseSummary[]).length, 2);
  s.select(["b"]);
  assert.equal(action().find(node => node.type === "Button")!.props["aria-pressed"], false);
});

test("filtered tree counts and bulk selection share results; related rows never show IDs or breadcrumbs", t => {
  const s = setup(); t.after(s.h.dispose);
  s.state.query = "A"; s.state.visible = [s.cases[0]];
  const tree = s.read().find(node => node.type === "RelatedCaseFolders")!;
  assert.equal(tree.props.count, 1);
  assert.equal((tree.props.folders as RepositoryFolder[]).length, 1);
  const rows = s.read().find(node => node.type === "PickerRows")!;
  assert.equal(rows.props.showMetadata, false);
  const select = s.read().find(node => node.type === "input" && node.props.type === "checkbox")!;
  invoke(select, "onChange");
  assert.deepEqual(s.scopes, [["a"]]);
  invoke(tree, "onChoose", "f");
  s.state.visible = [s.cases[1]];
  assert.equal(s.read().some(node => node.type === "PickerRows"), false, "filter changes must not escape the chosen folder");
});

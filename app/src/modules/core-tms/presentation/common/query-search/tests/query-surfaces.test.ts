import assert from "node:assert/strict";
import test from "node:test";
import { emptyRunFilters } from "../../../runs/filters/run-filter-model";
import { isQlSearchShortcut } from "../ql-search-shortcut";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { SelectionControls } from "../../../cases/selection/controls/SelectionControls";
import type { RunEvidencePicker } from "../../../../product-docs/presentation/run/editor/picker/RunEvidencePicker";

const shortcut = () => ({ key: "l", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false,
  defaultPrevented: false, preventDefault() {}, stopPropagation() {} });

test("suite selection opens its QL editor from search without changing selection actions", () => {
  const h = componentHarness();
  const { SelectionControls: View } = h.load<{ SelectionControls: typeof SelectionControls }>(
    new URL("../../../cases/selection/controls/SelectionControls.tsx", import.meta.url), name => {
      if (name.endsWith("ql-search-shortcut")) return { isQlSearchShortcut };
      if (name.endsWith("case-field-filters")) return { fieldFilterCount: () => 0 };
    });
  const props = { ru: false, state: { query: "", qlQuery: "key:HOST-1", options: { folders: [], components: [], tags: [] },
    directory: { items: [] }, filters: { type: "all", priority: "all", lifecycle: "all" }, facets: { folders: [], components: [] } } } as unknown as Parameters<typeof View>[0];
  const view = () => nodes(h.render(() => View(props)));
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, false);
  invoke(view().find(node => node.type === "input")!, "onKeyDown", shortcut());
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, true);
  assert.equal(view().find(node => node.type === "CaseQlAutocomplete")?.props.query, "key:HOST-1");
});

test("documentation run evidence uses the same shortcut and anchors QL to its search", () => {
  const h = componentHarness();
  Object.assign(h.window, { setTimeout() { return 1; }, clearTimeout() {} });
  const { RunEvidencePicker: View } = h.load<{ RunEvidencePicker: typeof RunEvidencePicker }>(
    new URL("../../../../product-docs/presentation/run/editor/picker/RunEvidencePicker.tsx", import.meta.url), name => {
      if (name.endsWith("ql-search-shortcut")) return { isQlSearchShortcut };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US" }) };
      if (name.endsWith("run-filter-model")) return { emptyRunFilters };
      if (name.endsWith("parse")) return { parseCaseQuery: () => ({}) };
      if (name.endsWith("useFieldPage")) return { useFieldPage: () => ({ items: [], search: "", setSearch() {} }) };
      if (name.endsWith("useRunEvidenceCatalog")) return { useRunEvidenceCatalog: () => ({ status: "idle" }) };
      if (name.endsWith("useWorkspaceMembers")) return { useWorkspaceMembers: () => ({ items: [] }) };
      if (name.endsWith("runEvidenceGroups")) return { groupRunEvidence: () => [] };
      if (name.endsWith("RunEvidenceFilters")) return { RunEvidenceFilters: "RunEvidenceFilters", runEvidenceFilterCount: () => 0 };
      if (name.endsWith("RunEvidenceQuery")) return { RunEvidenceQuery: "RunEvidenceQuery" };
    });
  const props = { scope: { workspaceId: "w", projectId: "p" } } as Parameters<typeof View>[0];
  const view = () => nodes(h.render(() => View(props)));
  assert.equal(view().find(node => node.type === "RunEvidenceQuery")?.props.open, false);
  const input = view().find(node => node.type === "Input")!;
  invoke(input, "onKeyDown", shortcut());
  const query = view().find(node => node.type === "RunEvidenceQuery")!;
  assert.equal(query.props.open, true);
  assert.equal(query.props.trigger, input.props.ref);
  assert.equal(view().some(node => node.type === "Button" && node.props.children === "QL"), false);
});

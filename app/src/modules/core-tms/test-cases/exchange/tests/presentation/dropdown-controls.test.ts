import assert from "node:assert/strict";
import test from "node:test";
import { AnchoredSelect } from "../../../../../../shared/components/anchored-popup/select/AnchoredSelect";
import { AnchoredAutocomplete } from "../../../../../../shared/components/anchored-popup/autocomplete/AnchoredAutocomplete";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { ImportDestination } from "../../library/presentation/destination/ImportDestination";
import type { ImportHistoryPage } from "../../library/presentation/history/ImportHistoryPage";
import { importCopy } from "../../localization/import-copy";

const projects = [{ id: "a", key: "A", name: "Alpha" }, { id: "b", key: "B", name: "Другой проект" }];
const resolve = (name: string) => {
  if (name.endsWith("AnchoredSelect")) return { AnchoredSelect };
  if (name.endsWith("AnchoredAutocomplete")) return { AnchoredAutocomplete };
  if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
  if (name.endsWith("import-copy")) return { importCopy };
};

test("history uses the stable project popup without changing project scoping", () => {
  const h = componentHarness();
  const { ImportHistoryPage: View } = h.load<{ ImportHistoryPage: typeof ImportHistoryPage }>(
    new URL("../../library/presentation/history/ImportHistoryPage.tsx", import.meta.url), resolve);
  const render = () => nodes(h.render(() => View({ workspaceId: "w", projects, initialProjectId: "a", revision: 3, canManage: true })));
  const initial = render();
  const picker = initial.find(node => (node.type as unknown) === AnchoredSelect)!;
  assert.ok(picker, "the project picker must delegate popup motion to AnchoredSelect");
  assert.deepEqual(Array.from(picker.props.selectedKeys as Iterable<string>), ["a"]);
  invoke(picker, "onSelectionChange", new Set(["missing"]));
  assert.equal((render().find(node => node.type === "ImportHistory")!.props.scope as { projectId: string }).projectId, "a");
  invoke(picker, "onSelectionChange", new Set(["b"]));
  const history = render().find(node => node.type === "ImportHistory")!;
  assert.deepEqual({ ...history.props.scope as object }, { workspaceId: "w", projectId: "b" });
  assert.equal(history.props.revision, 3);
  assert.equal(history.props.canManage, true);
});

test("destination project and folder popups retain valid callbacks and loading locks", () => {
  const h = componentHarness();
  const { ImportDestination: View } = h.load<{ ImportDestination: typeof ImportDestination }>(
    new URL("../../library/presentation/destination/ImportDestination.tsx", import.meta.url), resolve);
  const selectedProjects: string[] = [], destinations: string[] = [];
  const state = { targetProject: projects[0], destination: "/", loadingTarget: false, busy: false, error: "",
    context: { folders: [{ id: "folder", name: "Folder", path: "/Folder", archivedAt: null },
      { id: "archived", name: "Archived", path: "/Archived", archivedAt: "2026-01-01" }] },
    plan: { folders: [], newFolderCount: 0, existingFolderCount: 0 }, document: { testCases: [{ title: "One" }] },
    selectProject: (project: typeof projects[number]) => selectedProjects.push(project.id),
    setDestination: (path: string) => destinations.push(path), start: async () => {}, retryContext: () => {},
  } as unknown as Parameters<typeof ImportDestination>[0]["state"];
  const render = () => nodes(h.render(() => View({ state, projects, ru: true, onBack: () => {} })));
  const initial = render();
  const project = initial.find(node => (node.type as unknown) === AnchoredSelect)!;
  const folder = initial.find(node => (node.type as unknown) === AnchoredAutocomplete)!;
  assert.ok(project, "destination projects must use AnchoredSelect");
  assert.ok(folder, "destination folders must use AnchoredAutocomplete");
  invoke(project, "onSelectionChange", new Set(["missing"]));
  invoke(project, "onSelectionChange", new Set(["b"]));
  assert.deepEqual(selectedProjects, ["b"]);
  assert.equal(folder.props.selectedKey, "/");
  assert.equal(folder.props.isDisabled, false);
  assert.equal(initial.filter(node => node.type === "AutocompleteItem").length, 2);
  invoke(folder, "onSelectionChange", "/Archived");
  invoke(folder, "onSelectionChange", "/Folder");
  assert.deepEqual(destinations, ["/Folder"]);
  assert.ok((folder.props.popoverProps as { classNames: { content: string } }).classNames.content);
  state.loadingTarget = true;
  assert.equal(render().find(node => (node.type as unknown) === AnchoredAutocomplete)!.props.isDisabled, true);
});

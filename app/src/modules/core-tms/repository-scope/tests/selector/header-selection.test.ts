import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes, invoke } from "../../../portfolios/tests/support/component-harness";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import type { RepositoryScopeSelector } from "../../presentation/selector/RepositoryScopeSelector";

test("header keeps multiple checked projects until Apply and supports a selected portfolio group", async () => {
  const h = componentHarness(undefined, { document: { addEventListener() {}, removeEventListener() {} } });
  const selections: unknown[] = []; const navigated: string[] = [];
  const projects = [{ id: "a", name: "Web" }, { id: "b", name: "Mobile" }, { id: "c", name: "API" }];
  const model = { connection: "connected", data: { workspace: { id: "workspace" } }, projects, project: projects[0], projectId: "a",
    portfolioRepository: { catalog: null }, repositoryScope: { portfolioId: null, portfolioIds: [], projectIds: [],
      selectMany: (...args: unknown[]) => selections.push(args) }, isCaseSubmitting: () => false,
    chooseProject: async (id: string) => { navigated.push(id); return true; } } as unknown as WorkspaceModel;
  const Component = h.load<{ RepositoryScopeSelector: typeof RepositoryScopeSelector }>(new URL("../../presentation/selector/RepositoryScopeSelector.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
    if (name.endsWith("useRepositoryCatalog")) return { useRepositoryCatalog: () => ({ items: [{id:"p1",name:"Портфель 1"}, {id:"p2",name:"Портфель 2"}], loading:false }) };
  }).RepositoryScopeSelector;
  const render = () => nodes(h.render(() => Component({ model })));
  let tree = render(); invoke(tree.find(n => n.props["aria-haspopup"] === "menu")!, "onClick");
  tree = render(); invoke(tree.find(n => n.props.role === "menuitemcheckbox" && nodes(n.props.children).some(c => c.props.children === "Mobile"))!, "onClick");
  tree = render();
  assert.equal(tree.filter(n => n.props.role === "menuitemcheckbox" && n.props["aria-checked"]).length, 2);
  assert.deepEqual(selections, []); assert.deepEqual(navigated, []);
  await invoke(tree.find(n => n.type === "button" && n.props.children === "Применить")!, "onClick");
  assert.deepEqual(JSON.parse(JSON.stringify(selections)), [["projects", ["a", "b"], "a"]]);
  tree = render(); invoke(tree.find(n => n.props["aria-haspopup"] === "menu")!, "onClick");
  tree = render(); invoke(tree.find(n => n.props.role === "tab" && n.props.children === "Портфели")!, "onClick");
  tree = render(); for (const option of tree.filter(n => n.props.role === "menuitemcheckbox")) invoke(option, "onClick");
  tree = render(); assert.equal(tree.filter(n => n.props["aria-checked"]).length, 2);
  await invoke(tree.find(n => n.type === "button" && n.props.children === "Применить")!, "onClick");
  assert.deepEqual(JSON.parse(JSON.stringify(selections[1])), ["portfolios", ["p1", "p2"], "a"]);
  h.dispose();
});

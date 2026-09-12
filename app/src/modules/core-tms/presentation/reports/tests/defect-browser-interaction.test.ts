import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { DefectBrowser } from "../browser/DefectBrowser";

function harness(components = ["Payments", "Sign in"]) {
  const h = componentHarness(); const opened: string[] = [];
  const state = { groups: components.map(component => ({ component, total: 125, open: 90, critical: 2 })),
    totals: { total: 250, open: 180, critical: 4 }, groupsStatus: "ready", hasMoreGroups: false,
    branches: {} as Record<string, unknown>, openComponent: (component: string) => { opened.push(component); },
    loadMoreGroups() {}, retryGroups() {}, loadMoreComponent() {}, retryComponent() {} };
  const { DefectBrowser: View } = h.load<{ DefectBrowser: typeof DefectBrowser }>(new URL("../browser/DefectBrowser.tsx", import.meta.url), name => {
    if (name.endsWith("useDefectBrowser")) return { useDefectBrowser: () => state };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru", t: (key: string) => key }) };
    return undefined;
  });
  let sort: "asc" | "desc" | null = null; let selected = "";
  const render = () => nodes(h.render(() => View({ workspaceId: "workspace", projectId: "project", projectName: "Project",
    connected: true, defects: [], query: "", onQueryChange() {}, severitySort: sort,
    onSeveritySortChange: value => { sort = value; }, selectedDefectId: selected,
    onSelectDefect: id => { selected = id; }, onNew() {} })));
  return { h, state, opened, render, sort: () => sort, selected: () => selected };
}

test("an expanded group loads again after a new sorted result replaces the same group names", () => {
  const f = harness(); f.render(); f.render(); assert.deepEqual(f.opened, ["Payments"]);
  invoke(f.render().find(node => node.props["aria-label"] === "Сортировать по серьёзности")!, "onClick");
  assert.equal(f.sort(), "desc");
  f.state.groups = []; f.render();
  f.state.groups = [{ component: "Payments", total: 125, open: 90, critical: 2 }]; f.render();
  assert.equal(f.opened.filter(value => value === "Payments").length, 3);
  f.h.dispose();
});

test("several branches remain expanded independently and each row selects its real defect ID", () => {
  const f = harness(); f.render();
  const branches = f.render().filter(node => node.type === "DefectBranch");
  invoke(branches[1], "onToggle");
  const expanded = f.render().filter(node => node.type === "DefectBranch" && node.props.expanded);
  assert.equal(expanded.length, 2);
  invoke(expanded[1], "onSelectDefect", "defect-page-three"); assert.equal(f.selected(), "defect-page-three");
  invoke(expanded[0], "onToggle");
  assert.equal(f.render().filter(node => node.type === "DefectBranch" && node.props.expanded).length, 1);
  f.h.dispose();
});

test("component names from inherited Object properties render an unloaded branch safely", () => {
  const f = harness(["__proto__", "constructor", "toString"]);
  for (const branch of f.render().filter(node => node.type === "DefectBranch")) assert.equal(branch.props.branch, undefined);
  f.render(); assert.equal(f.opened[0], "__proto__"); f.h.dispose();
});

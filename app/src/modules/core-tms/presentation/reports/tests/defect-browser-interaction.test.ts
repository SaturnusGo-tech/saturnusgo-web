import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { DefectBrowser } from "../browser/DefectBrowser";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import * as scopeModel from "../../../defects/browser/model/defect-browser";
import type { useNavigationValue } from "../../../state/navigation/context/useNavigationValue";

function harness(components = ["Payments", "Sign in"]) {
  const h = componentHarness(); const opened: string[] = [];
  const navigation = new Map<string, unknown>();
  const navigationHook = h.load<{ useNavigationValue: typeof useNavigationValue }>(new URL(
    "../../../state/navigation/context/useNavigationValue.ts", import.meta.url), name => name.endsWith("workspace-history") ? {
      readNavigationContext: (key: string, initial: unknown) => navigation.get(key) ?? initial,
      saveNavigationContext: (key: string, value: unknown) => navigation.set(key, value),
    } : undefined);
  const requests: { scope: string; query: string; severitySort: string | null }[] = [];
  const state = { groups: components.map(component => ({ component, total: 125, open: 90, critical: 2 })),
    totals: { total: 250, open: 180, critical: 4 }, groupsStatus: "ready", hasMoreGroups: false,
    branches: {} as Record<string, unknown>, openComponent: (component: string) => { opened.push(component); },
    loadMoreGroups() {}, retryGroups() {}, loadMoreComponent() {}, retryComponent() {} };
  const { DefectBrowser: View } = h.load<{ DefectBrowser: typeof DefectBrowser }>(new URL("../browser/DefectBrowser.tsx", import.meta.url), name => {
    if (name.endsWith("useDefectBrowser")) return { useDefectBrowser: (options: typeof requests[number]) => { requests.push(options); return state; } };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru", t: (key: string) => key }) };
    if (name.endsWith("useNavigationValue")) return navigationHook;
    if (name.endsWith("defect-browser")) return scopeModel;
    return undefined;
  });
  let sort: "asc" | "desc" | null = null; let selected = "";
  const input = { query: "", defects: [] as Defect[], projectId: "project" };
  const render = () => nodes(h.render(() => View({ workspaceId: "workspace", projectName: "Project",
    connected: true, ...input, onQueryChange: value => { input.query = value; }, severitySort: sort,
    onSeveritySortChange: value => { sort = value; }, selectedDefectId: selected,
    onSelectDefect: id => { selected = id; }, onNew() {} })));
  return { h, state, opened, render, input, navigation, requests, sort: () => sort, selected: () => selected };
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

test("active is the default and scope changes preserve the search, sort and selected detail", () => {
  const f = harness(); f.input.query = "Payment";
  f.render(); assert.equal(f.requests[f.requests.length - 1]?.scope, "active");
  invoke(f.render().find(node => node.props["aria-label"] === "Сортировать по серьёзности")!, "onClick");
  invoke(f.render().find(node => node.type === "DefectBranch")!, "onSelectDefect", "selected-bug");
  invoke(f.render().find(node => node.type === "button" && node.props.children === "Закрытые")!, "onClick");
  f.render();
  assert.equal(f.requests[f.requests.length - 1]?.scope, "closed");
  assert.equal(f.requests[f.requests.length - 1]?.query, "Payment");
  assert.equal(f.requests[f.requests.length - 1]?.severitySort, "desc");
  assert.equal(f.selected(), "selected-bug");
  assert.equal(f.navigation.get("reports:workspace:project:scope"), "closed");
  f.h.dispose();
});

test("navigation restores its queue scope and a different project starts with active bugs", () => {
  const f = harness(); f.render();
  f.navigation.set("reports:workspace:project:scope", "closed"); f.h.emit("popstate");
  assert.equal(f.render().find(node => node.type === "button" && node.props.children === "Закрытые")?.props["aria-pressed"], true);
  f.input.projectId = "other-project"; f.render(); assert.equal(f.requests[f.requests.length - 1]?.scope, "active");
  f.input.projectId = "project"; f.render(); assert.equal(f.requests[f.requests.length - 1]?.scope, "closed");
  f.h.dispose();
});

test("a resolved selected bug keeps the active queue unchanged and offers its closed history", () => {
  const f = harness(); f.render();
  invoke(f.render().find(node => node.type === "DefectBranch")!, "onSelectDefect", "resolved-bug");
  f.input.defects = [{ id: "resolved-bug", status: "verified" } as Defect];
  const tree = f.render(); assert.equal(f.requests[f.requests.length - 1]?.scope, "active");
  const showClosed = tree.find(node => node.type === "button" && node.props.children === "Показать закрытые");
  assert.ok(showClosed); invoke(showClosed, "onClick"); f.render();
  assert.equal(f.requests[f.requests.length - 1]?.scope, "closed"); assert.equal(f.selected(), "resolved-bug");
  f.input.defects[0].status = "reopened";
  assert.ok(f.render().find(node => node.type === "button" && node.props.children === "Показать активные"));
  f.h.dispose();
});

test("an empty scoped search offers all statuses without clearing the query", () => {
  const f = harness([]); f.input.query = "HOST-BUG-12";
  const broaden = f.render().find(node => node.type === "button" && node.props.children === "Искать во всех статусах");
  assert.ok(broaden); invoke(broaden, "onClick"); f.render();
  assert.equal(f.requests[f.requests.length - 1]?.scope, "all");
  assert.equal(f.requests[f.requests.length - 1]?.query, "HOST-BUG-12"); f.h.dispose();
});

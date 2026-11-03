import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes, type Node } from "../../../../portfolios/tests/support/component-harness";
import type { PluginsList } from "../PluginsList";
import { INTEGRATIONS } from "../../catalog/integration-definitions";
import type { CatalogEntry } from "../../catalog/model/catalog-model";
import { status } from "../../../../codex-employee/tests/support/employee-fixture";
const text = (value: unknown): string => Array.isArray(value) ? value.map(text).join("") : typeof value === "string" ? value : value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
function setup() {
  const h = componentHarness(), changes: unknown[] = [], opened: unknown[] = [];
  const { PluginsList: View } = h.load<{ PluginsList: typeof PluginsList }>(new URL("../PluginsList.tsx", import.meta.url));
  const props: Parameters<typeof View>[0] = { entries: INTEGRATIONS.map(integration => ({ integration, status: ["gitlab", "jenkins", "teamcity"].includes(integration.id) ? "planned" : integration.id === "github" ? "connected" : "available" })) as CatalogEntry[],
    codex: { employee: { ...status, etag: '"3"', status: "not_activated", canActivate: true, canDeactivate: false, canConnect: false }, connections: [], loading: false, pending: false, error: null, connectionsError: null, refresh() {}, deactivate: async () => {}, revoke: async () => {} },
    ru: false, canManage: true, pending: false, error: null, onManage: (id, connect) => opened.push([id, connect]), onBrowse() {}, onToggle: (id, next) => changes.push([id, next]) };
  const render = () => h.render(() => View(props));
  return { h, props, changes, opened, render };
}
test("all catalog services remain visible, planned services and individual Swagger sources have no fake switches", () => {
  const t = setup(), tree = t.render(), all = nodes(tree);
  for (const item of INTEGRATIONS) assert.match(text(tree), new RegExp(item.name));
  assert.equal(all.filter(node => node.props.role === "switch").length, 7);
  assert.equal(all.some(node => node.props["aria-label"] === "Company Codex agent"), false);
  assert.equal(all.filter(node => node.type === "button" && node.props.disabled && /GitLab|Jenkins|TeamCity/.test(text(node))).length, 3);
  assert.ok(all.find(node => node.props["aria-label"] === "Manage Swagger")); t.h.dispose();
});
test("switch delegates the requested value without replacing server truth", () => {
  const t = setup(); let all = nodes(t.render());
  const github = all.find(node => node.props["aria-label"] === "Integration GitHub")!;
  invoke(github, "onClick"); assert.deepEqual(t.changes, [["github", false]]);
  assert.equal(nodes(t.render()).find(node => node.props["aria-label"] === "Integration GitHub")!.props["aria-checked"], true);
  assert.equal(all.some(node => node.props["aria-label"] === "Company Codex agent"), false);
  invoke(all.find(node => node.props["aria-label"] === "Manage Jira")!, "onClick"); assert.deepEqual(t.opened, [["jira", undefined]]); t.h.dispose();
});
test("only company administrators get a management link and company lifecycle has no workspace switch", () => {
  const t = setup(); t.props.canManage = false;
  let all = nodes(t.render()); assert.equal(all.find(node => node.props["aria-label"] === "Integration GitHub")!.props.disabled, true);
  assert.equal(all.some(node => node.type === "a" && node.props.href === "/admin/?page=codex"), false);
  t.props.canAdminCodex = true;
  all = nodes(t.render()); assert.equal(all.find(node => node.type === "a" && node.props.href === "/admin/?page=codex")?.props.children, "Company admin");
  t.props.pending = true; all = nodes(t.render()); assert.ok(all.filter(node => node.props.role === "switch").every(node => node.props.disabled));
  assert.equal(all.some(node => node.props["aria-label"] === "Company Codex agent"), false); t.h.dispose();
});
test("search, empty and failed update states retain a clear recovery path", () => {
  const t = setup(); t.props.error = "PRECONDITION_FAILED";
  const all = nodes(t.render()); assert.match(text(all.find(node => node.props.role === "alert")), /Open Manage/);
  invoke(all.find(node => node.type === "input")!, "onChange", { target: { value: "not-a-service" } });
  assert.match(text(t.render()), /No matching plugins/); assert.equal(nodes(t.render()).some(node => node.props.role === "switch"), false); t.h.dispose();
});

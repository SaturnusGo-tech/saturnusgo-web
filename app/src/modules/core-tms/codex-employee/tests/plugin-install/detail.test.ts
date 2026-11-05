import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes, type Node } from "../../../portfolios/tests/support/component-harness";
import type { CodexDetail } from "../../presentation/setup/CodexDetail";
import type { PluginInstallAction } from "../../../presentation/hooks/shared/plugin-install/PluginInstallAction";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { status } from "../support/employee-fixture";
const text = (value: unknown): string => Array.isArray(value) ? value.map(text).join("") : typeof value === "string" ? value
  : value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
const state = (active = false): ReturnType<typeof useCodexEmployee> => ({ employee: { ...status, status: active ? "active" : "not_activated", etag: '"3"' },
  connections: [], loading: false, pending: false, error: null, connectionsError: null, refresh() {}, deactivate: async () => {}, revoke: async () => {} });

test("Codex detail delegates installation states and Manage while company activation remains authoritative", async () => {
  const h = componentHarness(); let phase = "idle", installed = false, installCalls = 0, manageCalls = 0, account = "";
  const { CodexDetail: View } = h.load<{ CodexDetail: typeof CodexDetail }>(new URL("../../presentation/setup/CodexDetail.tsx", import.meta.url), name => {
    if (name.endsWith("useCodexInstall")) return { useCodexInstall: (_setup: unknown, accountKey: string) => {
      account = accountKey; return { phase, prepared: installed, install: async () => { installCalls++; phase = "loading"; } };
    } };
    if (name.endsWith("codex-plugin")) return { CODEX_PLUGIN_VERSION: "0.3.0" };
  });
  const resource = state();
  const render = () => h.render(() => View({ state: resource, locale: "en", accountKey: "company-a:qa-one", onBack() {}, onManage: () => { manageCalls++; } }));
  const action = () => nodes(render()).find(node => node.type === "PluginInstallAction")!;
  assert.equal(action().props.installed, false); assert.equal(action().props.canManage, false); assert.equal(account, "company-a:qa-one");
  await invoke(action(), "onInstall"); assert.equal(installCalls, 1); assert.equal(action().props.installing, true);
  phase = "ready"; installed = true; assert.equal(action().props.installed, true); invoke(action(), "onManage"); assert.equal(manageCalls, 1);
  assert.match(text(render()), /Connect Codex to your workspace through OAuth in Manage/);
  assert.equal(resource.employee?.status, "not_activated");
  const layout = () => JSON.stringify(render(), (_key, value) => value?.type === "PluginInstallAction" ? null : value);
  const completedTree = layout(); installed = false; phase = "idle";
  assert.equal(layout(), completedTree, "installation success must not insert or remove page content outside its stable action");
  installed = true; phase = "ready";
  resource.employee = { ...resource.employee!, status: "active" }; phase = "idle"; installed = false;
  assert.equal(action().props.canManage, true); assert.equal(action().props.installed, false);
  phase = "error"; assert.ok(nodes(render()).find(node => node.props.role === "alert"));
  assert.equal(Boolean(action().props.disabled), false); h.dispose();
});
function actionHarness(initial: Partial<Parameters<typeof PluginInstallAction>[0]> = {}) {
  const listeners = new Map<string, (event: { target: unknown }) => void>();
  const h = componentHarness("https://falcon.test/", { document: {
    addEventListener: (name: string, listener: (event: { target: unknown }) => void) => listeners.set(name, listener),
    removeEventListener: (name: string) => listeners.delete(name) } });
  const { PluginInstallAction: View } = h.load<{ PluginInstallAction: typeof PluginInstallAction }>(new URL("../../../presentation/hooks/shared/plugin-install/PluginInstallAction.tsx", import.meta.url));
  let installs = 0, manages = 0;
  const props = { installed: false, installing: false, disabled: false, ru: false, onInstall: () => { installs++; }, onManage: () => { manages++; }, ...initial };
  const render = () => nodes(h.render(() => View(props)));
  const button = (label: string) => render().find(node => node.type === "button" && text(node) === label)!;
  const primary = () => render().filter(node => node.type === "button" && node.props.ref);
  return { h, props, render, button, primary, listeners, installs: () => installs, manages: () => manages };
}
test("Install and Manage remain mounted with only the correct action exposed and callable", () => {
  const h = actionHarness(); const original = h.primary(); assert.equal(original.length, 2);
  const install = h.button("Install plugin"), manage = h.button("Manage");
  assert.equal(install.props["aria-hidden"], false); assert.equal(install.props.tabIndex, 0);
  assert.equal(manage.props["aria-hidden"], true); assert.equal(manage.props.tabIndex, -1); assert.equal(manage.props.disabled, true);
  invoke(manage, "onClick"); assert.equal(h.manages(), 0); invoke(install, "onClick"); assert.equal(h.installs(), 1);
  h.props.installing = true; const loading = h.button("Installing…");
  assert.equal(loading.props["aria-busy"], true); assert.equal(loading.props.disabled, true); invoke(loading, "onClick"); assert.equal(h.installs(), 1);
  h.props.installing = false; h.props.installed = true;
  const ready = h.button("Manage"); assert.equal(ready.props["aria-hidden"], false); assert.equal(ready.props.tabIndex, 0);
  assert.equal(h.button("Install plugin").props["aria-hidden"], true); invoke(ready, "onClick"); assert.equal(h.manages(), 1);
  assert.deepEqual(h.primary().map(node => node.props.ref), original.map(node => node.props.ref)); h.h.dispose();
});
test("keyboard focus transfers from Install to Manage, and hidden controls become inert", () => {
  const h = actionHarness(); const install = h.button("Install plugin"), manage = h.button("Manage"); let focused = 0;
  const installElement = { inert: false }, manageElement = { inert: true, focus: () => { focused++; } };
  (install.props.ref as { current: unknown }).current = installElement; (manage.props.ref as { current: unknown }).current = manageElement;
  invoke(install, "onFocus"); h.props.installing = true; h.render();
  h.props.installed = true; h.props.installing = false; h.render();
  assert.equal(focused, 1); assert.equal(installElement.inert, true); assert.equal(manageElement.inert, false);
  h.render(); assert.equal(focused, 1); h.h.dispose();
});
test("completion does not steal focus after the user moves outside the action or leaves its window", () => {
  for (const leave of ["focusin", "pointerdown", "window"]) {
    const h = actionHarness(); const install = h.button("Install plugin"), manage = h.button("Manage"); let focused = 0;
    (manage.props.ref as { current: unknown }).current = { focus: () => { focused++; } };
    invoke(install, "onFocus"); h.props.installing = true; h.render();
    if (leave === "window") h.h.emit("blur"); else h.listeners.get(leave)!({ target: "outside" });
    h.props.installed = true; h.props.installing = false; h.render(); assert.equal(focused, 0); h.h.dispose();
  }
});
test("readonly controls cannot install or manage, while an active company can offer pre-install Manage", () => {
  const h = actionHarness({ disabled: true, canManage: true }); const all = h.render().filter(node => node.type === "button");
  assert.ok(all.every(node => node.props.disabled)); all.forEach(node => invoke(node, "onClick")); assert.equal(h.installs(), 0); assert.equal(h.manages(), 0);
  h.props.disabled = false;
  const secondary = h.render().find(node => node.type === "button" && text(node) === "Manage" && !node.props.ref)!;
  assert.equal(secondary.props["aria-hidden"], false); invoke(secondary, "onClick"); assert.equal(h.manages(), 1);
  h.props.installed = true; const hidden = h.render().find(node => node.type === "button" && text(node) === "Manage" && !node.props.ref)!;
  assert.equal(hidden.props["aria-hidden"], true); assert.equal(hidden.props.disabled, true); assert.equal(hidden.props.tabIndex, -1); h.h.dispose();
});

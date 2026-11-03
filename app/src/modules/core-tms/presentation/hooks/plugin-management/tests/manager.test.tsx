import assert from "node:assert/strict";
import test from "node:test";
import type { IntegrationPluginManager } from "../IntegrationPluginManager";
import { INTEGRATIONS } from "../../catalog/integration-definitions";
import { isProvider } from "../../../../connectors/model/connector-types";
import { providerCopy } from "../../../../connectors/localization/connector-copy";
import { componentHarness, invoke, nodes, type Node } from "../../../../portfolios/tests/support/component-harness";

type Props = Parameters<typeof IntegrationPluginManager>[0];
function fixture(overrides: Partial<Props> = {}) {
  const h = componentHarness(); let refreshed = 0, backed = 0, viewed = 0;
  const { IntegrationPluginManager: View } = h.load<{ IntegrationPluginManager: typeof IntegrationPluginManager }>(new URL("../IntegrationPluginManager.tsx", import.meta.url), name => {
    if (name.endsWith("integration-definitions")) return { INTEGRATIONS };
    if (name.endsWith("connector-types")) return { isProvider };
    if (name.endsWith("connector-copy")) return { providerCopy };
    if (name.endsWith("WorkspaceConnectorContext")) return { useWorkspaceConnectors: () => ({ refresh: () => refreshed++ }) };
  });
  let props: Props = { id: "jira", workspaceId: "w", projectId: "p", canManage: true, capabilities: ["integrations"], connected: true,
    ru: false, onBack: () => backed++, onViewDetails: () => viewed++, ...overrides };
  return { render: () => nodes(h.render(() => View(props))), update: (next: Partial<Props>) => { props = { ...props, ...next }; },
    counts: () => ({ refreshed, backed, viewed }) };
}
const trigger = (all: Node[]) => all.find(node => node.type === "button" && node.props["aria-controls"])!;

test("manager lazily opens scoped real configuration and keeps its draft mounted while closed", () => {
  const f = fixture(); let all = f.render();
  assert.equal(all.some(node => node.type === "ConnectorSettings"), false);
  invoke(trigger(all), "onClick"); all = f.render();
  const config = all.find(node => node.type === "ConnectorSettings")!;
  assert.equal(config.props.embedded, true); assert.equal(config.props.provider, "jira");
  assert.equal(config.props.workspaceId, "w"); assert.equal(config.props.projectId, "p");
  assert.equal(config.props.canManage, true); assert.equal(config.props.connected, true);
  assert.deepEqual(Array.from(config.props.capabilities as string[]), ["integrations"]);
  invoke(config, "onSaved"); assert.equal(f.counts().refreshed, 1);
  const panel = all.find(node => node.props.id === trigger(all).props["aria-controls"])!;
  const element = { inert: false }; invoke(panel, "ref", element); assert.equal(element.inert, false);
  invoke(trigger(all), "onClick"); all = f.render();
  assert.equal(trigger(all).props["aria-expanded"], false);
  assert.equal(all.some(node => node.type === "ConnectorSettings"), true);
  invoke(all.find(node => node.props.id === panel.props.id)!, "ref", element); assert.equal(element.inert, true);
});
test("keyboard Escape closes inline setup without stealing nested dialog, menu or select dismissal", () => {
  const f = fixture({ requestSetup: true }); let all = f.render();
  const panel = all.find(node => node.props.id === trigger(all).props["aria-controls"])!; let stopped = 0;
  invoke(panel, "onKeyDown", { key: "Escape", defaultPrevented: false, target: { closest: () => ({}) }, stopPropagation: () => stopped++ });
  assert.equal(trigger(f.render()).props["aria-expanded"], true); assert.equal(stopped, 0);
  invoke(panel, "onKeyDown", { key: "Escape", defaultPrevented: false, target: { closest: () => null }, stopPropagation: () => stopped++ });
  assert.equal(trigger(f.render()).props["aria-expanded"], false); assert.equal(stopped, 1);
  all = f.render(); assert.equal(trigger(all).props["aria-expanded"], false);
  f.update({ requestSetup: false }); f.render(); f.update({ requestSetup: true }); f.render();
  assert.equal(trigger(f.render()).props["aria-expanded"], true);
});
test("YouTrack workspace scope and read-only permissions reach its existing settings", () => {
  const f = fixture({ id: "youtrack", requestSetup: true, canManage: false, ru: true }); const all = f.render();
  const config = all.find(node => node.type === "YouTrackSettings")!;
  assert.equal(config.props.workspaceId, "w"); assert.equal(config.props.embedded, true);
  assert.equal(config.props.canManage, false); assert.equal(config.props.languageTag, "ru-RU");
  invoke(config, "onStatusChange"); assert.equal(f.counts().refreshed, 1);
  assert.equal(all.find(node => node.type === "IntegrationGuideLink")?.props.article, "youtrack");
});
test("Swagger reuses API source manager only with management rights; planned providers expose no setup", () => {
  const admin = fixture({ id: "swagger", requestSetup: true }); const config = admin.render().find(node => node.type === "ApiSourceManager")!;
  assert.equal(config.props.workspaceId, "w"); assert.equal(config.props.projectId, "p"); assert.equal(config.props.embedded, undefined);
  assert.equal(admin.render().some(node => node.props["aria-controls"]), false);
  invoke(config, "onSaved"); assert.equal(admin.counts().refreshed, 1);
  const reader = fixture({ id: "swagger", requestSetup: true, canManage: false }).render();
  assert.equal(reader.some(node => node.type === "ApiSourceManager" || node.type === "ConnectorSettings"), false);
  for (const id of ["gitlab", "jenkins", "teamcity"] as const) {
    const planned = fixture({ id, requestSetup: true }).render();
    assert.equal(planned.some(node => node.props["aria-controls"] || node.type === "ConnectorSettings"), false);
  }
});
test("manager navigation and guides retain the selected provider", () => {
  const f = fixture({ id: "github" }); const all = f.render();
  invoke(all.find(node => node.type === "button" && node.props.children === "Plugin settings")!, "onClick");
  invoke(all.find(node => node.type === "button" && node.props.children === "View details")!, "onClick");
  assert.deepEqual(f.counts(), { refreshed: 0, backed: 1, viewed: 1 });
  assert.equal(all.find(node => node.type === "IntegrationGuideLink")?.props.article, "github");
});
test("successful provider, YouTrack and Swagger saves refresh the owning plugin catalog", () => {
  for (const [id, component, event] of [["jira", "ConnectorSettings", "onSaved"], ["youtrack", "YouTrackSettings", "onStatusChange"], ["swagger", "ApiSourceManager", "onSaved"]] as const) {
    let updated = 0;
    const onUpdated = () => updated++;
    const f = fixture({ id, requestSetup: true, onUpdated });
    const config = f.render().find(node => node.type === component)!;
    assert.equal(config.props[event], onUpdated);
    invoke(config, event);
    assert.equal(updated, 1);
    assert.equal(f.counts().refreshed, 0, "the owning catalog refresh replaces the narrower connector-only refresh");
  }
});

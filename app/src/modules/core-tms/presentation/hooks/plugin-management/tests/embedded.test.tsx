import assert from "node:assert/strict";
import test from "node:test";
import type { ConnectorChrome } from "../../../../connectors/presentation/chrome/ConnectorChrome";
import type { ConnectorSettings } from "../../../../connectors/presentation/ConnectorSettings";
import type { YouTrackSettings } from "../../youtrack/YouTrackSettings";
import type { ApiSourceManager } from "../../../../api-sources/presentation/ApiSourceManager";
import { providerCopy } from "../../../../connectors/localization/connector-copy";
import { hooksCopy } from "../../shared/hooks-copy";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

test("embedded connector chrome keeps provider tabs and removes its duplicate navigation", () => {
  const h = componentHarness(); const selected: string[] = [];
  const { ConnectorChrome: View } = h.load<{ ConnectorChrome: typeof ConnectorChrome }>(new URL("../../../../connectors/presentation/chrome/ConnectorChrome.tsx", import.meta.url), name => name.endsWith("connector-copy") ? { providerCopy } : undefined);
  const props = { provider: "github" as const, ru: false, tab: "impact" as const, onTab: (tab: string) => selected.push(tab), onBack() {}, project: "Release", enabled: true, children: "configuration" };
  const all = nodes(h.render(() => View({ ...props, embedded: true })));
  assert.equal(all.some(node => node.type === "aside" || node.type === "h1"), false);
  const tabs = all.filter(node => node.type === "button"); assert.equal(tabs.length, 4);
  assert.equal(tabs.find(node => node.props["aria-current"] === "page")?.props.children, "Impact Analysis");
  for (const tab of tabs) invoke(tab, "onClick");
  assert.deepEqual(selected, ["connection", "automation", "activity", "impact"]);
  assert.equal(nodes(h.render(() => View(props))).some(node => node.type === "aside"), true);
});
test("embedded connector preserves scoped state, save, pending and reader permissions", () => {
  const h = componentHarness(); const calls: unknown[] = []; let saves = 0;
  const state = { snapshot: { etag: '"v3"', connection: { id: "connection", enabled: true }, catalog: { projects: [{ id: "p", name: "Project" }] } },
    draft: { enabled: true }, pending: null as string | null, save: () => saves++ };
  const { ConnectorSettings: View } = h.load<{ ConnectorSettings: typeof ConnectorSettings }>(new URL("../../../../connectors/presentation/ConnectorSettings.tsx", import.meta.url), name => {
    if (name.endsWith("useConnector")) return { useConnector: (...args: unknown[]) => { calls.push(args); return state; } };
  });
  const props = { workspaceId: "w", projectId: "p", provider: "jira" as const, ru: false, canManage: true, capabilities: ["integrations"], connected: true, onBack() {}, onSaved() {}, embedded: true };
  let all = nodes(h.render(() => View(props)));
  assert.equal(all[0].props.embedded, true);
  assert.deepEqual(JSON.parse(JSON.stringify((calls[0] as unknown[])[0])), { workspaceId: "w", projectId: "p" });
  assert.equal((calls[0] as unknown[])[1], "jira"); assert.equal((calls[0] as unknown[])[3], props.onSaved);
  let prevented = false; invoke(all.find(node => node.type === "form")!, "onSubmit", { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true); assert.equal(saves, 1);
  state.pending = "save"; all = nodes(h.render(() => View(props)));
  assert.equal(all.find(node => node.type === "button" && node.props.type === "submit")?.props.disabled, true);
  all = nodes(h.render(() => View({ ...props, canManage: false })));
  assert.equal(all.find(node => node.type === "fieldset")?.props.disabled, true);
  assert.equal(all.some(node => node.props.type === "submit" || node.type === "DisconnectPanel"), false);
});
test("embedded YouTrack retains real Save and its pending and read-only gates", () => {
  const h = componentHarness(); let saved = 0; const called: unknown[][] = [];
  const state = { loading: false, loadFailed: false, configuration: { connection: { status: "connected" } }, draft: {}, action: "idle", save: () => saved++ };
  const { YouTrackSettings: View } = h.load<{ YouTrackSettings: typeof YouTrackSettings }>(new URL("../../youtrack/YouTrackSettings.tsx", import.meta.url), name => {
    if (name.endsWith("hooks-copy")) return { hooksCopy };
    if (name.endsWith("use-youtrack-settings")) return { useYouTrackSettings: (...args: unknown[]) => { called.push(args); return state; } };
    if (name.endsWith("use-youtrack-webhook-setup")) return { useYouTrackWebhookSetup: () => ({}) };
  });
  const props = { workspaceId: "w", status: null, languageTag: "en-US" as const, russian: false, canManage: true, onBack() {}, onStatusChange() {}, embedded: true };
  let all = nodes(h.render(() => View(props)));
  assert.equal(called[0][0], "w"); assert.equal(called[0][2], props.onStatusChange); assert.equal(called[0][3], true);
  assert.equal(all.some(node => node.type === "YouTrackSettingsHeader"), false);
  const form = all.find(node => node.type === "YouTrackSettingsForm")!;
  assert.equal(form.props.embedded, true); assert.equal(form.props.state, state);
  invoke(all.find(node => node.type === "button")!, "onClick"); assert.equal(saved, 1);
  state.action = "saving"; all = nodes(h.render(() => View(props)));
  assert.equal(all.find(node => node.type === "button")?.props.disabled, true);
  all = nodes(h.render(() => View({ ...props, canManage: false })));
  assert.equal(all.some(node => node.type === "button"), false);
  assert.equal(all.find(node => node.type === "YouTrackSettingsForm")?.props.canManage, false);
});
test("embedded API source manager preserves create/edit scope and actual save refresh callbacks", () => {
  const h = componentHarness(); let refreshed = 0, saved: unknown, scope: unknown; const source = { id: "source-1", name: "Billing API", sourceUrl: "https://api.test/openapi.json", projectIds: ["p"], enabled: true };
  const catalog = { items: [source], loading: false, error: null, refresh: () => refreshed++ };
  const { ApiSourceManager: View } = h.load<{ ApiSourceManager: typeof ApiSourceManager }>(new URL("../../../../api-sources/presentation/ApiSourceManager.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useApiSourceList")) return { useApiSourceList: (workspace: string) => { scope = workspace; return catalog; } };
    if (name.endsWith("useApiProjects")) return { useApiProjects: () => ({ items: [{ id: "p", name: "Release" }], loading: false, error: false }) };
  });
  const props = { workspaceId: "w", projectId: "p", onBack() {}, onSaved: (value: unknown) => { saved = value; }, embedded: true };
  let all = nodes(h.render(() => View(props)));
  assert.equal(scope, "w"); assert.equal(all.some(node => node.type === "h1"), false);
  const add = all.find(node => node.type === "Button" && Array.isArray(node.props.children) && node.props.children.includes("Connect API"))!;
  invoke(add, "onPress"); all = nodes(h.render(() => View(props)));
  const editor = all.find(node => node.type === "SourceEditor")!;
  assert.equal(editor.props.workspaceId, "w"); assert.equal(editor.props.projectId, "p"); assert.equal(editor.props.source, null);
  invoke(editor, "onSaved", source); assert.equal(refreshed, 1); assert.equal(saved, source);
  all = nodes(h.render(() => View(props))); assert.equal(all.some(node => node.type === "SourceEditor"), false);
  invoke(all.find(node => node.type === "Button" && Array.isArray(node.props.children) && nodes(node.props.children).some(child => child.type === "strong" && child.props.children === "Billing API"))!, "onPress");
  assert.equal(nodes(h.render(() => View(props))).find(node => node.type === "SourceEditor")?.props.source, source);
});

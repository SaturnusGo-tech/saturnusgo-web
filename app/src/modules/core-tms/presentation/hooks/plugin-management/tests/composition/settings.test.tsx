import assert from "node:assert/strict";
import test from "node:test";
import type { CodexPluginsSettings } from "../../../../../codex-employee/composition/settings/CodexPluginsSettings";
import { companyViewAvailable } from "../../../../../auth/managed/domain/features/company-features";
import { pluginSettingsLink, readPluginSettingsRoute } from "../../../../config/navigation/plugins/plugin-settings-route";
import { catalogEntries } from "../../../catalog/model/catalog-model";
import { isProvider } from "../../../../../connectors/model/connector-types";
import { integrationScreen } from "../../../hooks-navigation";
import { hooksCopy } from "../../../shared/hooks-copy";
import type { HooksView } from "../../../HooksView";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";

type Props = Parameters<typeof CodexPluginsSettings>[0];
function fixture(query: string, changes: Partial<Props> = {}, features = ["core", "integrations", "api_testing"]) {
  const h = componentHarness(`https://company.test/work/?workspaceId=w&projectId=p&view=config&settings=plugins${query}`);
  const visits: string[] = [], toggled: unknown[][] = []; let refreshed = 0;
  const codex = { loading: false, error: null, employee: { status: "active", canDeactivate: true, canConnect: true }, deactivate: () => toggled.push(["codex", false]) };
  const catalog = { configuration: null, status: null, statusFailed: false, connectorState: "ready", connections: [{ provider: "github", projectId: "p", enabled: true }], swaggerStatus: "available", refresh: () => refreshed++ };
  const props: Props = { workspaceId: "w", projectId: "p", canManage: true, capabilities: ["integrations:manage"], connected: true, ...changes };
  const { CodexPluginsSettings: View } = h.load<{ CodexPluginsSettings: typeof CodexPluginsSettings }>(new URL("../../../../../codex-employee/composition/settings/CodexPluginsSettings.tsx", import.meta.url), name => {
    if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", subject: "qa", companyCapabilities: features }) };
    if (name.endsWith("company-features")) return { companyViewAvailable };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("workspace-history")) return { HISTORY_CHANGE: "testhistory", visitWorkspace: (href: string) => { visits.push(href); h.navigate(new URL(href, h.window.location.href).href); h.emit("testhistory"); } };
    if (name.endsWith("plugin-settings-route")) return { pluginSettingsLink, readPluginSettingsRoute };
    if (name.endsWith("usePluginCatalogState")) return { usePluginCatalogState: () => catalog };
    if (name.endsWith("catalog-model")) return { catalogEntries };
    if (name.endsWith("connector-types")) return { isProvider };
    if (name.endsWith("usePluginConnectionToggle")) return { usePluginConnectionToggle: () => ({ pending: null, error: null, toggle: (...args: unknown[]) => toggled.push(args) }) };
    if (name.endsWith("useYouTrackPluginToggle")) return { useYouTrackPluginToggle: () => ({ pending: false, error: null, toggle: (...args: unknown[]) => toggled.push(["youtrack", ...args]) }) };
    if (name.endsWith("useWorkspaceCodex")) return { useWorkspaceCodex: () => codex };
  });
  return { render: () => nodes(h.render(() => View(props))), visits, toggled, h, refreshed: () => refreshed, refresh: catalog.refresh };
}

test("Settings manager and list navigation retain exact scope and permissions", () => {
  const f = fixture("&plugin=jira&pluginSetup=connect"); let all = f.render();
  const manager = all.find(node => node.type === "IntegrationPluginManager")!;
  assert.equal(manager.props.id, "jira"); assert.equal(manager.props.workspaceId, "w"); assert.equal(manager.props.projectId, "p");
  assert.equal(manager.props.canManage, true); assert.equal(manager.props.connected, true); assert.equal(manager.props.requestSetup, true);
  invoke(manager, "onBack"); all = f.render();
  assert.equal(all[0].type, "PluginsList");
  assert.equal(new URL(f.h.window.location.href).searchParams.has("pluginSetup"), false);
  invoke(all[0], "onManage", "github"); all = f.render();
  assert.equal(all[0].props.id, "github");
  invoke(all[0], "onViewDetails");
  const detail = new URL(f.h.window.location.href);
  assert.equal(detail.searchParams.get("view"), "hooks"); assert.equal(detail.searchParams.get("integration"), "github");
  assert.equal(detail.searchParams.get("workspaceId"), "w"); assert.equal(detail.searchParams.get("projectId"), "p");
  assert.equal(detail.searchParams.has("pluginSetup"), false);
});
test("company connector feature and manager rights are required without restricting personal Codex connections", () => {
  for (const f of [fixture("&plugin=jira", { canManage: false }), fixture("&plugin=jira", {}, ["core", "api_testing"])]) {
    assert.equal(f.render()[0].type, "CompanyFeatureUnavailable");
    assert.equal(f.render().some(node => node.type === "IntegrationPluginManager"), false);
  }
  const codex = fixture("&plugin=codex", { canManage: false }).render()[0];
  assert.equal(codex.type, "CodexPluginManager");
  const restricted = fixture("&plugin=swagger", {}, ["core", "integrations"]).render()[0];
  assert.equal(restricted.type, "CompanyFeatureUnavailable");
});
test("each generic Settings manager receives the owning catalog refresh after save", () => {
  for (const id of ["jira", "youtrack", "swagger"] as const) {
    const f = fixture(`&plugin=${id}`), manager = f.render()[0];
    assert.equal(manager.type, "IntegrationPluginManager");
    assert.equal(manager.props.onUpdated, f.refresh);
    invoke(manager, "onUpdated"); assert.equal(f.refreshed(), 1);
    invoke(manager, "onBack"); assert.equal(f.render()[0].type, "PluginsList");
  }
});
test("API-only company retains real Swagger source management without other integrations", () => {
  const manager = fixture("&plugin=swagger", {}, ["core", "api_testing"]).render()[0];
  assert.equal(manager.type, "IntegrationPluginManager"); assert.equal(manager.props.id, "swagger");
  const all = fixture("", {}, ["core", "api_testing"]).render();
  const ids = (all[0].props.entries as { integration: { id: string } }[]).map(entry => entry.integration.id);
  assert.ok(ids.includes("swagger")); assert.equal(ids.includes("jira"), false);
});
test("scoped GitHub review link opens the inline review immediately", () => {
  for (const query of ["&analysisId=analysis_12&impact=1", "&analysisId=analysis_12", "&impact=1"]) {
    const manager = fixture(`&plugin=github${query}`).render()[0];
    assert.equal(manager.type, "IntegrationPluginManager"); assert.equal(manager.props.id, "github");
    assert.equal(manager.props.requestSetup, true);
  }
});
test("existing provider toggle uses real settings handler while first connection opens setup", () => {
  const f = fixture(""); const list = f.render()[0];
  (list.props.onToggle as (id: string, next: boolean) => void)("github", false);
  assert.deepEqual(f.toggled, [["github", false]]);
  (list.props.onToggle as (id: string, next: boolean) => void)("jira", true);
  const url = new URL(f.h.window.location.href);
  assert.equal(url.searchParams.get("plugin"), "jira"); assert.equal(url.searchParams.get("pluginSetup"), "connect");
});
test("legacy GitHub analysis-only and impact links route directly to the scoped inline manager", () => {
  for (const query of ["&analysisId=analysis_12", "&impact=1", "&analysisId=analysis_12&impact=1"]) {
    const h = componentHarness(`https://company.test/work/?workspaceId=w&projectId=p&view=hooks&integration=github${query}`), visits: string[] = [];
    Object.defineProperty(h.window.location, "search", { get: () => new URL(h.window.location.href).search });
    const { HooksView: View } = h.load<{ HooksView: typeof HooksView }>(new URL("../../../HooksView.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", subject: "qa", companyCapabilities: ["core", "integrations"] }) };
      if (name.endsWith("company-features")) return { companyViewAvailable };
      if (name.endsWith("workspace-history")) return { visitWorkspace: (href: string) => visits.push(href) };
      if (name.endsWith("plugin-settings-route")) return { pluginSettingsLink };
      if (name.endsWith("useWorkspaceCodex")) return { useWorkspaceCodex: () => ({ loading: false, employee: null, error: null }) };
      if (name.endsWith("usePluginCatalogState")) return { usePluginCatalogState: () => ({ configuration: null, status: null, statusFailed: false, connectorState: "ready", connections: [], swaggerStatus: "available" }) };
      if (name.endsWith("catalog-model")) return { catalogEntries };
      if (name.endsWith("hooks-navigation")) return { integrationScreen };
      if (name.endsWith("hooks-copy")) return { hooksCopy };
    });
    h.render(() => View({ workspaceId: "w", projectId: "p", canManage: true, capabilities: ["integrations"], connected: true }));
    assert.equal(visits.length, 1);
    const url = new URL(visits[0]); assert.equal(url.searchParams.get("view"), "config");
    assert.equal(url.searchParams.get("plugin"), "github"); assert.equal(url.searchParams.get("pluginSetup"), "connect");
    assert.equal(url.searchParams.get("workspaceId"), "w"); assert.equal(url.searchParams.get("projectId"), "p");
    if (query.includes("analysisId")) assert.equal(url.searchParams.get("analysisId"), "analysis_12");
  }
});

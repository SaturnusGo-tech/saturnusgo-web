import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import { workspaceViewAllowed } from "../../../auth/managed/domain/features/workspace-view-access";
import { companyViewAvailable } from "../../../auth/managed/domain/features/company-features";
import type { WorkspaceStage } from "../WorkspaceStage";

test("managed tester and core-only company reach restored Codex through the stage", () => {
  for (const [companyCapabilities, project] of [[["core", "integrations"], { id: "p" }], [["core"], { id: "p" }], [["core"], undefined]] as const) {
    const h = componentHarness();
    const { WorkspaceStage: render } = h.load<{ WorkspaceStage: typeof WorkspaceStage }>(new URL("../WorkspaceStage.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("useWorkspaceCapabilities")) return { useWorkspaceCapabilities: () => ({ value: { canConnect: true } }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", companyCapabilities }) };
      if (name.endsWith("workspace-view-access")) return { workspaceViewAllowed };
      if (name.endsWith("company-features")) return { companyViewAvailable };
    });
    const model = { view: "hooks", connection: "connected", project, canManageIntegrations: !project,
      data: { workspace: { id: "w" }, meta: { authorization: { capabilities: ["integration:read"] } } } };
    const all = nodes(h.render(() => render({ model: model as never })));
    assert.ok(all.some(node => node.type === "HooksView"));
    assert.equal(all.find(node => node.type === "HooksView")?.props.canManage, false);
    assert.equal(all.find(node => node.type === "HooksView")?.props.projectId, project?.id ?? "");
  }
});

test("outer navigation exposes Hooks to managed readers without exposing unrelated views", () => {
  for (const companyCapabilities of [["core"], ["core", "integrations"]]) {
    const h = componentHarness();
    const { Navigation } = h.load<{ Navigation: (props: never) => unknown }>(new URL("../../navigation/Navigation.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("useWorkspaceCapabilities")) return { useWorkspaceCapabilities: () => ({ value: { canConnect: true } }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", companyCapabilities }) };
      if (name.endsWith("workspace-view-access")) return { workspaceViewAllowed };
      if (name.endsWith("company-features")) return { companyViewAvailable };
      if (name.endsWith("useSidebarReveal")) return { useSidebarReveal: () => ({ revealed: false, setCollapsed() {} }) };
      if (name.endsWith("useSidebarPreferences")) return { useSidebarPreferences: () => ({ preferences: {} }) };
      if (name.endsWith("sidebar-navigation")) return { SIDEBAR_NAVIGATION_IDS: ["hooks", "api", "dashboard"], getSidebarNavigation: (input: { availableIds: string[] }) => ({ ...input, groups: [] }) };
    });
    const all = nodes(h.render(() => Navigation({ view: "cases", userCapabilities: ["integration:read"] } as never)));
    const menu = all.find(node => node.type === "SidebarSectionsMenu")!;
    assert.deepEqual(Array.from(menu.props.availableIds as string[]), ["hooks"]);
  }
});

test("workspace permits shared connector catalog for readers only with a project", () => {
  for (const [caps, project, expected] of [
    [["integration:read"], { id: "p" }, true], [[], { id: "p" }, false], [["integration:read"], undefined, false],
  ] as const) {
    const h = componentHarness(undefined, { process: { env: {} } });
    Object.assign(h.window, { localStorage: { getItem: () => null } });
    const model = { view: "cases", project, repositoryScope: { key: "workspace" }, connection: "connected", canManageIntegrations: false, activeProjectRuns: [],
      data: { workspace: { id: "w" }, meta: { authorization: { capabilities: caps } } } };
    const { LocalizedWorkspace } = h.load<{ LocalizedWorkspace: () => unknown }>(new URL("../../workspace/LocalizedWorkspace.tsx", import.meta.url), name => {
      if (name.endsWith("WorkspaceStartup")) return { useWorkspaceStartupPending() {} };
      if (name.endsWith("TmsHttpClientContext")) return { useOptionalTmsHttpClient: () => null };
      if (name.endsWith("useMemberPresence")) return { useMemberPresence() {} };
      if (name.endsWith("useWorkspaceModel")) return { useWorkspaceModel: () => model };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("usePageAppearance")) return { usePageAppearance: () => ({ current: null }) };
      if (name.endsWith("useHistoryScroll")) return { useHistoryScroll: () => {} };
      if (name.endsWith("useProductDocsAccess")) return { useProductDocsAccess: () => ({ enabled: false }) };
    });
    const content = nodes(h.render(LocalizedWorkspace));
    assert.equal(content.find(node => node.type === "WorkspaceConnectorProvider")?.props.active, expected);
  }
});

test("managed no-project navigation allows Hooks on both sidebar surfaces", () => {
  const h = componentHarness();
  const { Navigation } = h.load<{ Navigation: (props: never) => unknown }>(new URL("../../navigation/Navigation.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
    if (name.endsWith("useWorkspaceCapabilities")) return { useWorkspaceCapabilities: () => ({ value: { canConnect: true } }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", companyCapabilities: ["core"] }) };
    if (name.endsWith("workspace-view-access")) return { workspaceViewAllowed };
    if (name.endsWith("company-features")) return { companyViewAvailable };
    if (name.endsWith("useSidebarReveal")) return { useSidebarReveal: () => ({ revealed: false, setCollapsed() {} }) };
      if (name.endsWith("useSidebarPreferences")) return { useSidebarPreferences: () => ({ preferences: {} }) };
    if (name.endsWith("sidebar-navigation")) return { SIDEBAR_NAVIGATION_IDS: ["hooks"], getSidebarNavigation: (input: { availableIds: string[] }) => ({ ...input, groups: [] }) };
  });
  const all = nodes(h.render(() => Navigation({ view: "cases", disabled: true, userCapabilities: [] } as never)));
  for (const type of ["NavigationGroups", "SidebarSectionsMenu"]) assert.equal(all.find(node => node.type === type)?.props.allowManagedHooks, true);
});

test("managed no-project primary navigation clicks Hooks while cases stays disabled", () => {
  const h = componentHarness(); const navigated: string[] = [];
  const { NavigationGroups } = h.load<{ NavigationGroups: (props: never) => unknown }>(new URL("../../navigation/ui/NavigationGroups.tsx", import.meta.url), name => {
    if (name.endsWith("workspace-view-access")) return { workspaceViewDisabledWithoutProject: require("../../../auth/managed/domain/features/workspace-view-access").workspaceViewDisabledWithoutProject };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("sidebar-catalog")) return { sidebarCatalog: { hooks: { icon: "Icon", labelKey: "hooks" }, cases: { icon: "Icon", labelKey: "cases" } }, sidebarGroupLabels: { management: { en: "Management" } } };
  });
  const all = nodes(h.render(() => NavigationGroups({ groups: [{ id: "management", ids: ["hooks", "cases"] }], activeId: null, disabled: true, allowManagedHooks: true, activeRunCount: 0, onNavigate: (id: string) => navigated.push(id) } as never)));
  const hooks = all.find(node => node.props["data-testid"] === "nav-hooks")!;
  assert.equal(hooks.props.disabled, false); (hooks.props.onClick as () => void)();
  assert.deepEqual(navigated, ["hooks"]); assert.equal(all.find(node => node.props["data-testid"] === "nav-cases")?.props.disabled, true);
});

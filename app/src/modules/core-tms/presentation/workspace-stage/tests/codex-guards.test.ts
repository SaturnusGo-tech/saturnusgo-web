import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import { workspaceViewAllowed } from "../../../auth/managed/domain/features/workspace-view-access";
import { companyViewAvailable } from "../../../auth/managed/domain/features/company-features";
import type { WorkspaceStage } from "../WorkspaceStage";

test("managed tester and core-only company reach restored Codex through the stage", () => {
  for (const companyCapabilities of [["core", "integrations"], ["core"]]) {
    const h = componentHarness();
    const { WorkspaceStage: render } = h.load<{ WorkspaceStage: typeof WorkspaceStage }>(new URL("../WorkspaceStage.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", companyCapabilities }) };
      if (name.endsWith("workspace-view-access")) return { workspaceViewAllowed };
      if (name.endsWith("company-features")) return { companyViewAvailable };
    });
    const model = { view: "hooks", connection: "connected", project: { id: "p" }, canManageIntegrations: false,
      data: { workspace: { id: "w" }, meta: { authorization: { capabilities: ["integration:read"] } } } };
    const all = nodes(h.render(() => render({ model: model as never })));
    assert.ok(all.some(node => node.type === "HooksView"));
    assert.equal(all.find(node => node.type === "HooksView")?.props.canManage, false);
  }
});

test("outer navigation exposes Hooks to managed readers without exposing unrelated views", () => {
  for (const companyCapabilities of [["core"], ["core", "integrations"]]) {
    const h = componentHarness();
    const { Navigation } = h.load<{ Navigation: (props: never) => unknown }>(new URL("../../navigation/Navigation.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ kind: "managed", companyCapabilities }) };
      if (name.endsWith("workspace-view-access")) return { workspaceViewAllowed };
      if (name.endsWith("company-features")) return { companyViewAvailable };
      if (name.endsWith("useSidebarPreferences")) return { useSidebarPreferences: () => ({ preferences: {} }) };
      if (name.endsWith("sidebar-navigation")) return { SIDEBAR_NAVIGATION_IDS: ["hooks", "api", "dashboard"], getSidebarNavigation: (input: { availableIds: string[] }) => ({ ...input, groups: [] }) };
    });
    const all = nodes(h.render(() => Navigation({ view: "cases", userCapabilities: ["integration:read"] } as never)));
    const menu = all.find(node => node.type === "SidebarSectionsMenu")!;
    assert.deepEqual(Array.from(menu.props.availableIds as string[]), ["hooks"]);
  }
});

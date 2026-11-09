import assert from "node:assert/strict";
import test from "node:test";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { workspaceViews, type View } from "../../../state/types/workspace";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import { companyViewAvailable } from "../../../auth/managed/domain/features/company-features";
import type { WorkspaceHeader } from "../WorkspaceHeader";

function header(view: View, project: object | null = { id: "project-a" }, connection = "connected", canManage = true, attachmentAccess = true, companyCapabilities?: string[]) {
  const h = componentHarness();
  const { WorkspaceHeader: component } = h.load<{ WorkspaceHeader: typeof WorkspaceHeader }>(new URL("../WorkspaceHeader.tsx", import.meta.url),
    name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ languageTag: "en", locale: "en", t: (key: string) => key }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ companyCapabilities }) };
      if (name.endsWith("display-name")) return { workspaceDisplayName: ({ name }: { name: string }) => name };
      if (name.endsWith("company-features")) return { companyViewAvailable };
    });
  const model = { view, project, connection, repositoryScope: {}, folders: { canManage }, data: { workspace: { name: "Umbrella" }, meta: { authorization: { capabilities: attachmentAccess ? ["attachment:manage"] : [] } } } } as unknown as WorkspaceModel;
  return nodes(h.render(() => component({ model, sidebarCollapsed: true, onToggleSidebar() {}, dashboardActionsRef() {} })));
}

test("environment management stays out of the global header", () => {
  for (const view of workspaceViews) {
    assert.equal(header(view).some(node => node.props["data-testid"] === "open-environments"), false, view);
  }
});

test("the test case import shortcut lives in the repository header and keeps import permissions", () => {
  const shortcut = (items: ReturnType<typeof header>) => items.find(node => node.props["data-testid"] === "open-case-import");
  const actions = header("cases").filter(node => ["open-case-import", "open-environments"].includes(String(node.props["data-testid"])));
  assert.equal(actions.map(node => node.props["data-testid"]).join(","), "open-case-import");
  assert.equal(shortcut(header("cases"))?.props.isDisabled, false);
  assert.equal(shortcut(header("cases", { id: "project-a" }, "connected", false))?.props.isDisabled, true);
  assert.equal(shortcut(header("cases", { id: "project-a" }, "connected", true, false))?.props.isDisabled, true);
  assert.equal(shortcut(header("cases", { id: "project-a" }, "disconnected"))?.props.isDisabled, true);
  assert.equal(shortcut(header("cases", { id: "project-a" }, "connected", true, true, [])), undefined);
  assert.equal(shortcut(header("cases", null)), undefined);
  assert.equal(shortcut(header("dashboard")), undefined);
});

test("the global header exposes dashboard actions only on Dashboard", () => {
  for (const view of workspaceViews) {
    assert.equal(header(view).some(node => "data-workspace-dashboard-actions" in node.props), view === "dashboard", view);
  }
});

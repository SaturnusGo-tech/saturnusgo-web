import assert from "node:assert/strict";
import test from "node:test";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { workspaceViews, type View } from "../../../state/types/workspace";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import type { WorkspaceHeader } from "../WorkspaceHeader";

function header(view: View, project: object | null = { id: "project-a" }, connection = "connected") {
  const h = componentHarness();
  const { WorkspaceHeader: component } = h.load<{ WorkspaceHeader: typeof WorkspaceHeader }>(new URL("../WorkspaceHeader.tsx", import.meta.url),
    name => name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ languageTag: "en", t: (key: string) => key }) } : undefined);
  const model = { view, project, connection, repositoryScope: {}, data: { workspace: { name: "Umbrella" } } } as unknown as WorkspaceModel;
  return nodes(h.render(() => component({ model, sidebarCollapsed: true, onToggleSidebar() {} })));
}

test("the global environment shortcut belongs only to dashboard and test cases", () => {
  for (const view of workspaceViews) {
    const shortcuts = header(view).filter(node => node.props["data-testid"] === "open-environments");
    assert.equal(shortcuts.length, view === "dashboard" || view === "cases" ? 1 : 0, view);
  }
});

test("environment shortcut still requires project context and respects connection readiness", () => {
  for (const view of ["dashboard", "cases"] as const) {
    assert.equal(header(view, null).some(node => node.props["data-testid"] === "open-environments"), false);
    const ready = header(view).find(node => node.props["data-testid"] === "open-environments");
    const offline = header(view, { id: "project-a" }, "disconnected").find(node => node.props["data-testid"] === "open-environments");
    assert.equal(ready?.props.disabled, false);
    assert.equal(offline?.props.disabled, true);
  }
});

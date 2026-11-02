import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { RareNavigationMenu } from "../RareNavigationMenu";
import { workspaceViewDisabledWithoutProject } from "../../../../auth/managed/domain/features/workspace-view-access";
import * as model from "../../model/sidebar-navigation";

function setup() {
  const h = componentHarness(undefined, { document: { body: {} } }); let dismissed = 0;
  const navigated: string[] = [], pinned: string[] = [];
  const { RareNavigationMenu: render } = h.load<{ RareNavigationMenu: typeof RareNavigationMenu }>(new URL("../RareNavigationMenu.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("sidebar-navigation")) return model;
    if (name.endsWith("sidebar-catalog")) return { sidebarCatalog: {
      portfolios: { labelKey: "nav.portfolios", icon: "Folder" }, hooks: { labelKey: "nav.hooks", icon: "ConnectApps" },
    } };
    if (name.endsWith("workspace-view-access")) return { workspaceViewDisabledWithoutProject };
    if (name.endsWith("useRailPopup")) return { useRailPopup: () => ({ root: { current: null }, trigger: { current: null }, panel: { current: null },
      open: true, position: { left: 64, top: 100 }, openHover() {}, leave() {}, cancelClose() {}, toggle() {}, triggerKeyDown() {}, panelKeyDown() {},
      dismiss() { dismissed++; } }) };
  });
  const props = { availableIds: ["portfolios", "hooks"] as const, activeId: "hooks" as const,
    pinnedIds: ["hooks"] as const, disabled: true, allowManagedHooks: true,
    onNavigate: (id: string) => navigated.push(id), onTogglePinned: (id: string) => pinned.push(id) };
  return { all: () => nodes(h.render(() => render(props))), navigated, pinned, dismissed: () => dismissed };
}

test("overflow shows only permitted rare routes and keeps managed Hooks available without a project", () => {
  const h = setup(), all = h.all();
  const rows = all.filter(node => node.props["data-rare-section"]);
  assert.deepEqual(rows.map(node => node.props["data-rare-section"]), ["portfolios", "hooks"]);
  assert.equal(rows[1].props["aria-current"], "page"); assert.equal(rows[1].props.disabled, false);
  invoke(rows[1], "onClick"); assert.deepEqual(h.navigated, ["hooks"]); assert.equal(h.dismissed(), 1);
});

test("pinning changes the rail without navigating or dismissing overflow", () => {
  const h = setup(), pin = h.all().find(node => node.props["data-rare-pin"] === "hooks")!;
  assert.equal(pin.props["aria-pressed"], true); invoke(pin, "onClick");
  assert.deepEqual(h.pinned, ["hooks"]); assert.deepEqual(h.navigated, []); assert.equal(h.dismissed(), 0);
});

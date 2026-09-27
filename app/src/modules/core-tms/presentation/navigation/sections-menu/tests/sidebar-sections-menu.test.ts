import assert from "node:assert/strict";
import test from "node:test";
import type { ComponentProps } from "react";
import type { SidebarSectionsMenu } from "../SidebarSectionsMenu";
import * as model from "../../model/sidebar-navigation";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

function menu() {
  const h = componentHarness(); let outside = () => {}; let focus = 0;
  const { SidebarSectionsMenu: renderMenu } = h.load<{ SidebarSectionsMenu: typeof SidebarSectionsMenu }>(
    new URL("../SidebarSectionsMenu.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
      if (name.endsWith("sidebar-navigation")) return model;
      if (name.endsWith("useAnchoredPopup")) return { useAnchoredPopup: (_open: boolean, _inline: boolean, _root: unknown, _trigger: unknown, _panel: unknown, close: () => void) => { outside = close; } };
    });
  const navigated: string[] = []; const pinned: string[] = []; const modes: string[] = [];
  const props: ComponentProps<typeof SidebarSectionsMenu> = { collapsed: false, availableIds: ["hooks", "cases", "dashboard"], activeId: "cases",
    preferences: { mode: "all", pinned: ["hooks"] }, disabled: false,
    onMode: value => modes.push(value), onTogglePinned: value => pinned.push(value), onNavigate: value => navigated.push(value) };
  const render = () => nodes(h.render(() => renderMenu(props)));
  const trigger = () => render().find(node => node.props["data-testid"] === "nav-all-sections")!;
  const open = () => { (trigger().props.ref as { current: unknown }).current = { focus() { focus++; } }; invoke(trigger(), "onClick"); };
  return { props, render, trigger, open, navigated, pinned, modes, focus: () => focus, outside: () => outside() };
}

test("all sections lists only allowed routes in canonical order and marks the current page", () => {
  const h = menu(); h.open();
  const rows = h.render().filter(node => node.props["data-sidebar-section"]);
  assert.deepEqual(rows.map(node => node.props["data-sidebar-section"]), ["dashboard", "cases", "hooks"]);
  assert.equal(rows[1].props["aria-current"], "page");
  const all = h.render();
  for (const button of all.filter(node => node.type === "button")) {
    assert.equal(nodes(button.props.children).some(node => node.type === "button"), false, "buttons must not contain other buttons");
  }
});

test("pinning and changing modes keep the menu open without navigating", () => {
  const h = menu(); h.open();
  const pin = h.render().find(node => node.props["data-sidebar-pin"] === "hooks")!;
  assert.equal(pin.props["aria-pressed"], true); invoke(pin, "onClick");
  const mode = h.render().find(node => node.props["data-sidebar-mode"] === "contextual")!;
  invoke(mode, "onChange");
  assert.deepEqual(h.pinned, ["hooks"]); assert.deepEqual(h.modes, ["contextual"]);
  assert.deepEqual(h.navigated, []); assert.equal(h.trigger().props["aria-expanded"], true);
});

test("navigation and Escape close the popup and restore focus", () => {
  const h = menu(); h.open();
  invoke(h.render().find(node => node.props["data-sidebar-section"] === "hooks")!, "onClick");
  assert.deepEqual(h.navigated, ["hooks"]); assert.equal(h.trigger().props["aria-expanded"], false); assert.equal(h.focus(), 1);
  h.open(); let prevented = false; let stopped = false;
  invoke(h.render()[0], "onKeyDown", { key: "Escape", preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
  assert.equal(prevented, true); assert.equal(stopped, true); assert.equal(h.focus(), 2);
  assert.equal(h.trigger().props["aria-expanded"], false);
});

test("outside dismissal preserves pointer focus", () => {
  const h = menu(); h.open(); h.outside();
  assert.equal(h.trigger().props["aria-expanded"], false); assert.equal(h.focus(), 0);
});

test("without a project the launcher, modes and pins work while only portfolios and API can navigate", () => {
  const h = menu(); h.props.disabled = true; h.props.availableIds = ["cases", "portfolios", "api"];
  assert.notEqual(h.trigger().props.disabled, true); h.open();
  assert.equal(h.trigger().props["aria-expanded"], true);
  const rows = h.render().filter(node => node.props["data-sidebar-section"]);
  assert.deepEqual(rows.map(node => [node.props["data-sidebar-section"], node.props.disabled]), [["cases", true], ["portfolios", false], ["api", false]]);
  invoke(h.render().find(node => node.props["data-sidebar-mode"] === "contextual")!, "onChange");
  invoke(h.render().find(node => node.props["data-sidebar-pin"] === "cases")!, "onClick");
  assert.deepEqual(h.modes, ["contextual"]); assert.deepEqual(h.pinned, ["cases"]);
  invoke(rows.find(node => node.props["data-sidebar-section"] === "api")!, "onClick");
  assert.deepEqual(h.navigated, ["api"]);
});

test("collapsed trigger retains an accessible name while exposing a label hook", () => {
  const h = menu(); h.props.collapsed = true;
  assert.equal(h.trigger().props["aria-label"], "All sections");
  assert.equal(h.render()[0].props["data-collapsed"], true);
  assert.equal(h.trigger().props["data-nav-label"], "All sections");
  assert.equal(h.trigger().props.title, undefined);
});

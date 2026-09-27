import assert from "node:assert/strict";
import test from "node:test";
import type { NavigationTooltip } from "../NavigationTooltip";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";

class FakeElement {
  attributes = new Map<string, string>();
  style = { left: "", top: "", fontFamily: "", setProperty() {} };
  dataset: Record<string, string> = {};
  textContent = ""; isConnected = true; parent: FakeElement | null = null;
  listeners = new Map<string, Set<(event: Record<string, unknown>) => void>>();
  shown = false;
  constructor(public native = true) { if (!native) this.showPopover = undefined as never; }
  showPopover() { this.shown = true; }
  hidePopover() { this.shown = false; }
  matches(selector: string) { return selector === ":popover-open" ? this.shown : false; }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  hasAttribute(name: string) { return this.attributes.has(name); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
  contains(node: unknown): boolean { return node === this || node instanceof FakeElement && Boolean(node.parent && this.contains(node.parent)); }
  closest(): FakeElement | null { return this.attributes.has("data-nav-label") ? this : this.parent?.closest() ?? null; }
  getBoundingClientRect() { return { left: 8, top: 100, right: 72, bottom: 144, width: 64, height: 44 }; }
  addEventListener(name: string, callback: (event: Record<string, unknown>) => void) {
    const list = this.listeners.get(name) ?? new Set(); list.add(callback); this.listeners.set(name, list);
  }
  removeEventListener(name: string, callback: (event: Record<string, unknown>) => void) { this.listeners.get(name)?.delete(callback); }
  emit(name: string, event: Record<string, unknown> = {}) { this.listeners.get(name)?.forEach(listener => listener(event)); }
}
function fixture(native = true) {
  const nav = new FakeElement(), button = new FakeElement(), tip = new FakeElement(native);
  button.parent = nav; button.setAttribute("data-nav-label", "Test runs"); button.setAttribute("title", "Native title");
  button.setAttribute("aria-describedby", "existing-help");
  const document = { body: new FakeElement(), activeElement: null };
  const h = componentHarness(undefined, { Element: FakeElement, HTMLElement: FakeElement, document,
    getComputedStyle: () => ({ fontFamily: "system-ui", getPropertyValue: () => "#111" }) });
  Object.assign(h.window, { innerWidth: 1440, innerHeight: 900 });
  const windowEvents = new FakeElement();
  Object.assign(h.window, { addEventListener: windowEvents.addEventListener.bind(windowEvents), removeEventListener: windowEvents.removeEventListener.bind(windowEvents) });
  const portals: unknown[] = [];
  const { NavigationTooltip: component } = h.load<{ NavigationTooltip: typeof NavigationTooltip }>(
    new URL("../NavigationTooltip.tsx", import.meta.url), name => name === "react-dom" ? { createPortal: (child: unknown, host: unknown) => { portals.push(host); return child; } } : undefined);
  const props = { collapsed: true, root: { current: nav as unknown as HTMLElement } };
  const render = () => nodes(h.render(() => component(props)));
  const initial = render().find(node => node.props.role === "tooltip"); assert.ok(initial);
  (initial.props.ref as { current: unknown }).current = tip;
  props.collapsed = false; render(); props.collapsed = true; render(); render();
  return { h, props, nav, button, tip, render, portals, document, windowEvents };
}

test("collapsed hover uses top layer and restores native title and existing descriptions on exit", () => {
  const f = fixture(); f.nav.emit("pointerover", { target: f.button, pointerType: "mouse" });
  assert.equal(f.tip.textContent, "Test runs"); assert.equal(f.tip.shown, true);
  assert.equal(f.button.hasAttribute("title"), false);
  assert.match(f.button.getAttribute("aria-describedby") ?? "", /existing-help/);
  assert.notEqual(f.button.getAttribute("aria-describedby"), "existing-help");
  f.nav.emit("pointerout", { target: f.button, relatedTarget: null });
  assert.equal(f.tip.shown, false); assert.equal(f.button.getAttribute("title"), "Native title");
  assert.equal(f.button.getAttribute("aria-describedby"), "existing-help");
});

test("keyboard focus opens the tooltip; blur, viewport changes and unmount clean it up", () => {
  const f = fixture(); f.nav.emit("focusin", { target: f.button }); assert.equal(f.tip.shown, true);
  f.nav.emit("focusout", { target: f.button, relatedTarget: null }); assert.equal(f.tip.shown, false);
  f.nav.emit("focusin", { target: f.button }); f.windowEvents.emit("scroll"); assert.equal(f.tip.shown, false);
  f.nav.emit("focusin", { target: f.button }); f.windowEvents.emit("resize"); assert.equal(f.tip.shown, false);
  f.nav.emit("focusin", { target: f.button }); f.h.dispose(); assert.equal(f.tip.shown, false);
  assert.equal([...f.nav.listeners.values()].reduce((sum, list) => sum + list.size, 0), 0);
  assert.equal([...f.windowEvents.listeners.values()].reduce((sum, list) => sum + list.size, 0), 0);
});

test("expanded and mobile navigation never shows tooltips", () => {
  const f = fixture(); Object.assign(f.h.window, { innerWidth: 760 });
  f.nav.emit("pointerover", { target: f.button }); assert.equal(f.tip.shown, false);
  Object.assign(f.h.window, { innerWidth: 1440 }); f.props.collapsed = false; f.render();
  f.nav.emit("focusin", { target: f.button }); assert.equal(f.tip.shown, false);
});

test("Escape dismisses without swallowing other handlers, and descendant pointer movement keeps the label", () => {
  const f = fixture(); const icon = new FakeElement(); icon.parent = f.button;
  f.nav.emit("pointerover", { target: icon }); assert.equal(f.tip.shown, true);
  f.nav.emit("pointerout", { target: f.button, relatedTarget: icon }); assert.equal(f.tip.shown, true);
  f.windowEvents.emit("keydown", { key: "Escape", preventDefault: () => assert.fail("must not intercept global shortcuts") });
  assert.equal(f.tip.shown, false);
});

test("unsupported popovers render into body and use the same labelled-anchor cleanup", () => {
  const f = fixture(false); f.nav.emit("focusin", { target: f.button });
  assert.equal(f.portals[f.portals.length - 1], f.document.body);
  assert.equal(f.tip.dataset.open, "true"); assert.equal(f.tip.textContent, "Test runs");
  f.props.collapsed = false; f.render();
  assert.equal(f.tip.dataset.open, undefined); assert.equal(f.button.getAttribute("title"), "Native title");
  assert.equal(f.button.getAttribute("aria-describedby"), "existing-help");
});

test("cleanup preserves independently updated titles and descriptions", () => {
  const f = fixture(); f.nav.emit("focusin", { target: f.button });
  f.button.setAttribute("title", "Updated title");
  f.button.setAttribute("aria-describedby", `${f.button.getAttribute("aria-describedby")} new-help`);
  f.nav.emit("pointerleave");
  assert.equal(f.button.getAttribute("title"), "Updated title");
  assert.equal(f.button.getAttribute("aria-describedby"), "existing-help new-help");
});

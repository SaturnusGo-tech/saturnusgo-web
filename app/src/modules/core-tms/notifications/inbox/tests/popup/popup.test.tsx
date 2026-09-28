import assert from "node:assert/strict";
import { test } from "node:test";
import { popupHarness } from "./support/harness";

test("native inbox remains in top layer, fits resized viewports and Escape restores the bell", t => {
  const h = popupHarness(t); h.open();
  assert.equal(h.state().portalHost, null); assert.equal(h.panel.shown, true); assert.equal(h.heading.focused, 1);
  h.resize(320, 240); assert.equal(h.panel.style.width, "300px"); assert.equal(h.panel.style.height, "220px");
  assert.equal(h.panel.style.left, "10px"); assert.equal(h.panel.style.top, "10px");
  const escape = h.emit(h.panel, "keydown", undefined, "Escape");
  assert.equal(escape.event.defaultPrevented, true); assert.equal(h.state().open, false); assert.equal(h.trigger.focused, 1);
  assert.equal(h.panel.shown, false); assert.equal(h.disconnected(), 1);
});

test("panel contextmenu stops the native sidebar listener but preserves the browser menu", t => {
  const h = popupHarness(t); h.open();
  const menu = h.emit(h.panel, "contextmenu");
  assert.equal(menu.stopped, true); assert.equal(menu.event.defaultPrevented, false); assert.equal(h.state().open, true);
});

test("unsupported popovers use the themed app outside nav and portaled content counts as inside", t => {
  const h = popupHarness(t, false); h.open();
  assert.equal(h.state().portalHost, h.app); assert.equal(h.panel.parent, h.app); assert.equal(h.heading.focused, 1);
  h.emit(h.document, "pointerdown", h.heading); h.emit(h.document, "focusin", h.heading);
  assert.equal(h.state().open, true);
  h.emit(h.document, "focusin", h.document.body); assert.equal(h.state().open, false); assert.equal(h.trigger.focused, 0);
});

test("body fallback carries Falcon theme tokens and removes listeners on unmount", t => {
  const h = popupHarness(t, false, false); h.open();
  assert.equal(h.state().portalHost, h.document.body); assert.equal(h.panel.style.properties.get("--ink"), "#eee");
  assert.equal(h.panel.style.fontFamily, "Falcon system");
  h.unmount(); assert.equal(h.disconnected(), 1);
  assert.equal(h.emit(h.panel, "contextmenu").stopped, false);
});

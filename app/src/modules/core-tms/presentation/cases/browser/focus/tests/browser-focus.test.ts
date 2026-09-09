import assert from "node:assert/strict";
import test from "node:test";
import { browserFocusHarness } from "./browser-focus-harness";

test("mobile case navigation moves focus into the visible detail and restores its case leaf on close", () => {
  const app = browserFocusHarness(); app.panel.visible = false; app.render(false); app.focusLeaf();
  app.tree.visible = false; app.panel.visible = true; app.document.activeElement = app.document.body;
  app.render(true); assert.equal(app.document.activeElement, app.panel);
  app.tree.visible = true; app.panel.visible = false; app.render(false);
  assert.equal(app.document.activeElement, app.leaf); app.dispose();
});
test("desktop panes and hidden embedded tabs never capture focus", () => {
  const app = browserFocusHarness(); app.render(false); app.focusLeaf(); app.render(true);
  assert.equal(app.document.activeElement, app.leaf);
  app.tree.visible = false; app.panel.visible = false; app.outside.focus(); app.render(true);
  assert.equal(app.document.activeElement, app.outside); app.dispose();
});
test("responsive collapse moves hidden tree focus, preserves external focus, and falls back when the opener was removed", () => {
  const app = browserFocusHarness(); app.render(false); app.focusLeaf(); app.render(true);
  app.tree.visible = false; app.document.activeElement = app.document.body; app.resize();
  assert.equal(app.document.activeElement, app.panel);
  app.leaf.isConnected = false; app.tree.visible = true; app.panel.visible = false; app.render(false);
  assert.equal(app.document.activeElement, app.fallback);
  app.outside.focus(); app.tree.visible = false; app.panel.visible = true; app.render(true);
  assert.equal(app.document.activeElement, app.outside); app.dispose();
});

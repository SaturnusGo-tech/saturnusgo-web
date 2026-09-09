import assert from "node:assert/strict";
import test from "node:test";
import { focusHarness } from "./focus-harness";

test("an inspector mounted in a hidden project tab never captures or traps overview focus", () => {
  const h = focusHarness(false);
  assert.equal(h.panel.focused, 0);
  assert.equal(h.key(), 0); assert.equal(h.key(true), 0);
  assert.equal(h.panel.focused, 0);
  h.dispose(); h.flushFrames();
  assert.equal(h.opener.focused, 0);
});
test("hiding an open overlay immediately releases Tab without waiting for effect cleanup", () => {
  const h = focusHarness();
  assert.equal(h.panel.focused, 1);
  h.document.activeElement = h.last;
  h.hide();
  assert.equal(h.key(), 0); assert.equal(h.key(true), 0);
  assert.equal(h.first.focused, 0); assert.equal(h.last.focused, 0);
  h.dispose(); h.flushFrames();
  assert.equal(h.list.inert, false); assert.equal(h.tree.inert, false);
  assert.equal(h.opener.focused, 0);
});
test("returning to a visible overlay preserves forward and reverse keyboard containment", () => {
  const h = focusHarness(false); h.show();
  h.document.activeElement = h.last;
  assert.equal(h.key(), 1); assert.equal(h.document.activeElement, h.first);
  assert.equal(h.key(true), 1); assert.equal(h.document.activeElement, h.last);
  h.document.activeElement = h.opener;
  assert.equal(h.key(true), 1); assert.equal(h.document.activeElement, h.last);
  assert.equal(h.key(false, "ArrowDown"), 0);
  h.dispose();
});
test("visible empty overlays trap focus, and normal close restores only a still-visible opener", () => {
  const h = focusHarness(); h.panel.children = [];
  assert.equal(h.key(), 1); assert.equal(h.panel.focused, 2);
  h.dispose(); h.flushFrames(); assert.equal(h.opener.focused, 1);
  const switched = focusHarness(); switched.dispose(); switched.hide(); switched.flushFrames();
  assert.equal(switched.opener.focused, 0);
});

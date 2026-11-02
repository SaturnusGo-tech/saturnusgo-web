import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react-test-renderer";
import type { KeyboardEvent } from "react";
import { popupHarness } from "./harness";

test("hover waits before opening, never takes focus and tolerates travel into the portal", async t => {
  const h = await popupHarness(t);
  await act(async () => h.state().openHover()); await h.advance(139);
  assert.equal(h.state().open, false);
  await h.advance(1); assert.equal(h.state().open, true); assert.equal(h.items[0].focused, 0);
  await act(async () => h.state().leave()); await h.advance(179);
  assert.equal(h.state().open, true);
  await act(async () => h.state().cancelClose()); await h.advance(100);
  assert.equal(h.state().open, true);
  await act(async () => h.state().leave()); await h.advance(180);
  assert.equal(h.state().open, false); assert.equal(h.restored(), 0);
});

test("leaving before the hover delay cancels opening", async t => {
  const h = await popupHarness(t);
  await act(async () => h.state().openHover()); await h.advance(60);
  await act(async () => h.state().leave()); await h.advance(300);
  assert.equal(h.state().open, false);
});

test("keyboard activation focuses actions, arrows navigate and Escape restores the trigger", async t => {
  const h = await popupHarness(t); const down = h.key("ArrowDown");
  await act(async () => h.state().triggerKeyDown(down as unknown as KeyboardEvent));
  assert.equal(down.prevented, true); assert.equal(h.state().open, true); assert.equal(h.doc.activeElement, h.items[0]);
  await act(async () => h.state().panelKeyDown(h.key("ArrowUp") as unknown as KeyboardEvent));
  assert.equal(h.doc.activeElement, h.items[2]);
  await act(async () => h.state().panelKeyDown(h.key("Home") as unknown as KeyboardEvent));
  assert.equal(h.doc.activeElement, h.items[0]);
  const escape = h.key("Escape");
  await act(async () => h.state().panelKeyDown(escape as unknown as KeyboardEvent));
  assert.equal(h.state().open, false); assert.equal(h.restored(), 1); assert.equal(escape.stopped, true);
});

test("pointer activation and outside dismissal preserve the user's focus", async t => {
  const h = await popupHarness(t);
  await act(async () => h.state().toggle()); assert.equal(h.state().open, true);
  assert.equal(h.items[0].focused, 0);
  await h.emit("pointerdown", h.items[0]); assert.equal(h.state().open, true);
  await h.emit("pointerdown", h.trigger); assert.equal(h.state().open, true);
  await h.emit("pointerdown"); assert.equal(h.state().open, false); assert.equal(h.restored(), 0);
  await act(async () => h.state().openKeyboard());
  await h.emit("pointerdown"); assert.equal(h.state().open, false); assert.equal(h.restored(), 0);
});

test("Escape after a hover opening closes without moving focus", async t => {
  const h = await popupHarness(t);
  await act(async () => h.state().openHover()); await h.advance(140);
  const event = Object.assign(new Event("keydown", { cancelable: true }), { key: "Escape" });
  await act(async () => { h.doc.dispatchEvent(event); });
  assert.equal(h.state().open, false); assert.equal(h.restored(), 0);
  assert.equal(event.defaultPrevented, true);
});

test("position follows the trigger and remains within narrow, short viewports", async t => {
  const h = await popupHarness(t);
  await act(async () => h.state().toggle()); assert.deepEqual(h.state().position, { left: 72, top: 100 });
  h.win.innerWidth = 200; h.win.innerHeight = 150;
  await h.emit("resize", h.win, h.win);
  assert.deepEqual(h.state().position, { left: 8, top: 8 });
  assert.equal(h.panel.style.width, "184px"); assert.equal(h.panel.style.maxHeight, "134px");
  h.win.innerWidth = 800; h.win.innerHeight = 600; h.anchor.top = 400;
  await h.emit("scroll", h.win, h.win);
  assert.deepEqual(h.state().position, { left: 72, top: 400 });
});

test("growing popup content stays within the viewport without focusing again", async t => {
  const h = await popupHarness(t); h.anchor.top = 450;
  await act(async () => h.state().openKeyboard());
  assert.equal(h.state().position.top, 412); assert.equal(h.items[0].focused, 1);
  h.panel.height = 300;
  await act(async () => { for (const resize of h.resizes) resize(); });
  assert.equal(h.state().position.top, 292); assert.equal(h.items[0].focused, 1);
});

test("hover opening another rail popup dismisses the keyboard popup without taking focus", async t => {
  const h = await popupHarness(t, 2);
  await act(async () => h.state().openKeyboard());
  assert.equal(h.state().open, true); assert.equal(h.items[0].focused, 1);
  await act(async () => h.state().leave());
  await act(async () => h.state(1).openHover()); await h.advance(140);
  assert.equal(h.state().open, false); assert.equal(h.state(1).open, true);
  assert.equal(h.items[0].focused, 1); assert.equal(h.restored(), 0);
});

test("opening a popup cancels another popup's pending hover", async t => {
  const h = await popupHarness(t, 2);
  await act(async () => h.state().openHover()); await h.advance(60);
  await act(async () => h.state(1).openKeyboard()); await h.advance(300);
  assert.equal(h.state().open, false); assert.equal(h.state(1).open, true);
});

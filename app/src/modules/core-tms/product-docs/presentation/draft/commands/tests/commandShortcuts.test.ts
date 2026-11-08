import assert from "node:assert/strict";
import test from "node:test";
import { productDocShortcut, productDocShortcutCommand } from "../keyboard/commandShortcuts";

const key = (code: string, options = {}) => ({
  code, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false,
  repeat: false, isComposing: false, getModifierState: () => false, ...options,
});

test("displayed macOS and Windows shortcuts map to the same editor command", () => {
  assert.equal(productDocShortcutCommand(key("Digit1", { metaKey: true, altKey: true }), true), "h1");
  assert.equal(productDocShortcutCommand(key("Digit3", { ctrlKey: true, altKey: true }), false), "h3");
  assert.equal(productDocShortcutCommand(key("Digit7", { ctrlKey: true, shiftKey: true }), false), "checklist");
  assert.equal(productDocShortcutCommand(key("Backslash", { metaKey: true, shiftKey: true }), true), "code");
  assert.equal(productDocShortcutCommand(key("Period", { altKey: true, shiftKey: true }), false), "quote");
  assert.equal(productDocShortcut("h1", true)?.display, "⌘ ⌥ 1");
  assert.equal(productDocShortcut("h1", false)?.display, "Ctrl+Alt+1");
  assert.equal(productDocShortcut("attachment", false)?.aria, "Control+Shift+U");
});

test("ordinary keys, composition, AltGr, repeats and wrong platform chords remain available", () => {
  assert.equal(productDocShortcutCommand(key("Digit7"), true), undefined);
  assert.equal(productDocShortcutCommand(key("KeyU", { ctrlKey: true, shiftKey: true }), true), undefined);
  assert.equal(productDocShortcutCommand(key("Digit3", { ctrlKey: true, altKey: true, getModifierState: () => true }), false), undefined);
  assert.equal(productDocShortcutCommand(key("Digit1", { metaKey: true, altKey: true, isComposing: true }), true), undefined);
  assert.equal(productDocShortcutCommand(key("Digit6", { metaKey: true, shiftKey: true, repeat: true }), true), undefined);
  assert.equal(productDocShortcut("diagram", true), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

Object.assign(globalThis, { React });
let reduced = false;
const loader = require("node:module"), previous = loader._load, previousCss = require.extensions[".css"];
require.extensions[".css"] = (module: NodeModule) => { module.exports = {}; };
loader._load = function (name: string, parent: NodeModule, main: boolean) {
  if (name === "@heroui/react") return { Popover: "section", PopoverContent: "div" };
  if (name === "framer-motion") return { useReducedMotion: () => reduced };
  if (name.endsWith("/ProductDocToolbarMenu")) return { ProductDocToolbarButton: "button" };
  if (name.endsWith("/HighlightPalette")) return { HighlightPalette: "fieldset" };
  return previous.call(this, name, parent, main);
};
const { ProductDocHighlightPicker } = require("../ProductDocHighlightPicker") as typeof import("../ProductDocHighlightPicker");
loader._load = previous;
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

test("a chosen highlight applies once after overlay focus release with normal and reduced motion", async () => {
  const oldFrame = globalThis.requestAnimationFrame;
  for (const preference of [false, true]) {
    const frames: FrameRequestCallback[] = [], chosen: unknown[] = [];
    globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
    reduced = preference; let view!: ReactTestRenderer;
    try {
      await act(async () => { view = create(<ProductDocHighlightPicker locale="en" onChoose={color => chosen.push(color)}/>); });
      await act(async () => view.root.findByType("button").props.onPress());
      assert.equal(view.root.findByType("section").props.isOpen, true);
      await act(async () => view.root.findByType("fieldset").props.onChoose("yellow"));
      const popup = view.root.findByType("section");
      assert.equal(popup.props.isOpen, false);
      assert.equal(popup.props.disableAnimation, preference ? true : undefined);
      assert.deepEqual(chosen, [], "wait until the overlay releases the editor focus scope");
      if (!preference) {
        popup.props.motionProps.onAnimationComplete("exit");
        popup.props.motionProps.onAnimationComplete("exit");
      }
      while (frames.length) await act(async () => { frames.shift()!(0); });
      assert.deepEqual(chosen, ["yellow"], "reduced motion has no animation completion event");
      popup.props.motionProps.onAnimationComplete("exit");
      while (frames.length) await act(async () => { frames.shift()!(0); });
      assert.deepEqual(chosen, ["yellow"]);
    } finally { await act(async () => view?.unmount()); globalThis.requestAnimationFrame = oldFrame; reduced = false; }
  }
});

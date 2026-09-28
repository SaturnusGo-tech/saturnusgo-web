import assert from "node:assert/strict";
import { test } from "node:test";
import { act, create } from "react-test-renderer";
import React, { useState } from "react";
import { useScreenshotMotion } from "../../../presentation/walkthrough/motion/useScreenshotMotion";
import type { ScreenshotDialog } from "../../../presentation/walkthrough/ScreenshotDialog";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { motionDom } from "../fake-dom";

Object.assign(globalThis, { React });

test("close waits for the shared element, restores focus and ignores navigation during dismissal", async () => {
  const d = motionDom(); let focused = 0, selected: number | null = 0;
  const button = { closest: () => ({ querySelector: () => d.origin }), querySelector: () => d.origin,
    focus: () => focused++ } as unknown as HTMLButtonElement;
  Object.assign(d.origin, { closest: () => button });
  const dialog = Object.assign(d.dialog, { open: false, showModal() { this.open = true; }, close() { this.open = false; } });
  let motion!: ReturnType<typeof useScreenshotMotion>;
  function Harness() {
    const [index, update] = useState<number | null>(0); selected = index;
    motion = useScreenshotMotion({ current: dialog as unknown as HTMLDialogElement }, { current: d.args.image }, { current: button }, index, update);
    return null;
  }
  let renderer!: ReturnType<typeof create>;
  act(() => { renderer = create(<Harness />); }); assert.equal(dialog.open, true);
  act(() => motion.close()); assert.equal(dialog.open, true); assert.equal(selected, 0);
  act(() => { motion.select(1); motion.close(); }); assert.equal(selected, 0);
  await act(async () => { for (const animation of d.animations) animation.finish(); await new Promise(resolve => setTimeout(resolve, 0)); });
  assert.equal(dialog.open, false); assert.equal(selected, null); assert.equal(focused, 1);
  assert.ok(d.clones.every(clone => !clone.isConnected)); act(() => renderer.unmount());
});

test("native Escape and backdrop dismiss through motion while arrows preserve existing navigation", () => {
  const h = componentHarness(); let closes = 0, prevented = 0; const selected: number[] = [];
  const { ScreenshotDialog: render } = h.load<{ ScreenshotDialog: typeof ScreenshotDialog }>(new URL("../../../presentation/walkthrough/ScreenshotDialog.tsx", import.meta.url), name => {
    if (name.endsWith("useDocumentationCopy")) return { useDocumentationCopy: () => ({}) };
    if (name.endsWith("useScreenshotMotion")) return { useScreenshotMotion: () => ({ close: () => closes++, closed() {}, select: (value: number) => selected.push(value) }) };
  });
  const steps = Array.from({ length: 3 }, () => ({ title: "Step", instruction: "Do", result: "Done", image: { src: "/image.jpg", alt: "View", width: 1440, height: 900 } }));
  const dialog = nodes(h.render(() => render({ steps, selected: 1, onSelect() {} }))).find(node => node.type === "dialog")!;
  invoke(dialog, "onCancel", { preventDefault: () => prevented++ }); assert.equal(prevented, 1); assert.equal(closes, 1);
  const backdrop = {}; invoke(dialog, "onClick", { target: backdrop, currentTarget: backdrop }); assert.equal(closes, 2);
  for (const key of ["ArrowLeft", "ArrowRight"]) invoke(dialog, "onKeyDown", { key, preventDefault: () => prevented++ });
  assert.deepEqual(selected, [0, 2]); assert.equal(prevented, 3);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { anchoredPopupMotion } from "../../motion/anchored-popup-motion";

test("anchored menus never animate their measured geometry", () => {
  const motion = anchoredPopupMotion({
    initial: { scale: 0.8, y: -8 },
    animate: { scale: 1, y: 0 },
    exit: { scale: 0.96, y: -4 },
    variants: { enter: { scale: 1.1 } },
  });
  assert.equal(motion.initial, "initial");
  assert.equal(motion.animate, "enter");
  assert.equal(motion.exit, "exit");
  for (const phase of Object.values(motion.variants ?? {})) {
    assert.deepEqual(Object.keys(phase), ["opacity"]);
  }
});

test("editor exit continuations retain their named phase and original callback", () => {
  const phases: unknown[] = [];
  const onAnimationComplete = (phase: unknown) => { phases.push(phase); };
  const motion = anchoredPopupMotion({ onAnimationComplete });
  assert.equal(motion.onAnimationComplete, onAnimationComplete);
  motion.onAnimationComplete?.("exit");
  assert.deepEqual(phases, ["exit"]);
});

test("popup event handlers and static styles are preserved without mutating caller props", () => {
  const onUpdate = () => {};
  const style = { pointerEvents: "auto" as const };
  const existing = { onUpdate, style, transition: { duration: 0.3 } };
  const motion = anchoredPopupMotion(existing);
  assert.equal(motion.onUpdate, onUpdate);
  assert.equal(motion.style, style);
  assert.equal(existing.transition.duration, 0.3);
  assert.deepEqual(motion.transition, { duration: 0.12, ease: "easeOut" });
});

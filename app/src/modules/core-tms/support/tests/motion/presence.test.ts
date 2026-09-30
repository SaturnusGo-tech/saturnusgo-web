import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../../state/navigation/browser/tests/project/hook-harness";
import type { useSupportDialogMotion } from "../../presentation/motion/useSupportDialogMotion";

function setup(reduced = false) {
  const h = hookHarness("https://falcon.test/");
  Object.assign(h.react, { useLayoutEffect: h.react.useEffect });
  let opacity = "1";
  Object.assign(h.window, { matchMedia: () => ({ matches: reduced }), getComputedStyle: () => ({ opacity }) });
  const hook = h.load<{ useSupportDialogMotion: typeof useSupportDialogMotion }>(new URL("../../presentation/motion/useSupportDialogMotion.ts", import.meta.url), () => ({})).useSupportDialogMotion;
  let open = false;
  const animations: Array<{ frames: Keyframe[]; finish: () => void; cancelled: boolean; opacityAtCancel?: string }> = [];
  const element = { style: { opacity: "" }, animate(frames: Keyframe[]) {
    let finish!: () => void;
    const finished = new Promise<void>(resolve => { finish = resolve; });
    const entry = { frames, finish, cancelled: false, opacityAtCancel: undefined as string | undefined }; animations.push(entry);
    return { finished, cancel() { entry.cancelled = true; entry.opacityAtCancel = element.style.opacity; } };
  } } as unknown as HTMLDivElement;
  const render = () => h.settle(() => { const result = hook(open); result.ref.current = result.present ? element : null; return result; });
  return { h, render, element, animations, set(value: boolean) { open = value; return render(); }, visual(value: string) { opacity = value; } };
}

test("opening keeps the final opacity underneath the animation so completion cannot flash transparent", async () => {
  const app = setup(); assert.equal(app.render().present, false);
  app.set(true); assert.equal(app.animations.length, 1);
  assert.equal(app.animations[0].frames[0].opacity, "0");
  app.animations[0].finish(); await Promise.resolve(); app.render();
  assert.equal(app.element.style.opacity, "1");
  assert.equal(app.animations[0].opacityAtCancel, "1"); app.h.dispose();
});

test("closing keeps the modal and focus scope mounted until its fade finishes without flashing opaque", async () => {
  const app = setup(); app.render(); app.set(true); app.animations[0].finish(); await Promise.resolve();
  assert.equal(app.set(false).present, true);
  assert.equal(app.element.style.opacity, "0");
  app.animations[1].finish(); await Promise.resolve();
  assert.equal(app.render().present, false); app.h.dispose();
  assert.equal(app.animations[1].opacityAtCancel, "0");
});

test("reopening mid-exit starts at the current opacity and ignores the stale completion", async () => {
  const app = setup(); app.render(); app.set(true); app.animations[0].finish(); await Promise.resolve(); app.set(false);
  app.visual("0.42"); app.set(true);
  assert.equal(app.animations[2].frames[0].opacity, "0.42");
  app.animations[1].finish(); await Promise.resolve(); assert.equal(app.render().present, true);
  app.animations[2].finish(); await Promise.resolve(); assert.equal(app.element.style.opacity, "1"); app.h.dispose();
});

test("reduced motion has no animation and closes immediately", () => {
  const app = setup(true); app.render(); assert.equal(app.set(true).present, true);
  assert.equal(app.set(false).present, false); assert.equal(app.animations.length, 0); app.h.dispose();
});

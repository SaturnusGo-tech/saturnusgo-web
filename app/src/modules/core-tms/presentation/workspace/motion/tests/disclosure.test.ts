import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../../../state/navigation/browser/tests/project/hook-harness";
import type { useDisclosureMotion } from "../../../common/disclosure/useDisclosureMotion";
function setup(reduced = false, slide = false, overflow: "hidden" | "visible" = "hidden") {
  const h = hookHarness("https://falcon.test/");
  Object.assign(h.react, { useLayoutEffect: h.react.useEffect });
  const visual = { height: 100, opacity: "0.63", transform: "matrix(1, 0, 0, 1, 0, -3)" };
  Object.assign(h.window, { matchMedia: () => ({ matches: reduced }), getComputedStyle: () => visual });
  const hook = h.load<{ useDisclosureMotion: typeof useDisclosureMotion }>(new URL("../../../common/disclosure/useDisclosureMotion.ts", import.meta.url), () => ({})).useDisclosureMotion;
  let open = true;
  const animations: Array<{ finish: () => void; cancelled: boolean; frames: Keyframe[] }> = [];
  const element = { style: { overflow: "" }, scrollHeight: 265, firstElementChild: { getBoundingClientRect: () => ({ height: 58 }) }, getBoundingClientRect: () => ({ height: visual.height }),
    animate(frames: Keyframe[]) {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => { finish = resolve; });
      const entry = { finish, frames, cancelled: false }; animations.push(entry);
      return { finished, cancel() { entry.cancelled = true; } };
    },
  } as unknown as HTMLDivElement;
  const render = () => h.settle(() => { const result = hook(open, slide, { overflow }); result.ref.current = element; return result; });
  return { h, render, animations, element, visual, set(value: boolean) { open = value; return render(); } };
}
test("closing a folder retains descendants until the measured collapse completes", async () => {
  const app = setup(); assert.equal(app.render().present, true); assert.equal(app.animations.length, 0);
  assert.equal(app.set(false).present, true); assert.equal(app.animations[0].frames[1].height, "0px");
  app.animations[0].finish(); await Promise.resolve(); assert.equal(app.render().present, false); app.h.dispose();
});
test("reversing a collapsing folder cancels its old animation without hiding the reopened content", async () => {
  const app = setup(); app.render(); app.set(false); app.set(true);
  assert.equal(app.animations[0].cancelled, true);
  app.animations[0].finish();
  app.animations[1].finish(); await Promise.resolve(); assert.equal(app.render().present, true); app.h.dispose();
});
test("reduced motion collapses immediately and never starts a height animation", () => {
  const app = setup(true); app.render(); assert.equal(app.set(false).present, false);
  assert.equal(app.set(true).present, true); assert.equal(app.animations.length, 0); app.h.dispose();
});

test("QL expands downward and retreats upward, retaining the closing input until completion", async () => {
  const app = setup(false, true); app.render();
  assert.equal(app.set(false).present, true);
  assert.equal(app.animations[0].frames[1].transform, "translateY(-6px)");
  app.animations[0].finish(); await Promise.resolve(); assert.equal(app.render().present, false);
  app.set(true); assert.equal(app.animations[1].frames[0].transform, "translateY(-6px)");
  assert.equal(app.animations[1].frames[1].transform, "none"); app.h.dispose();
});


test("QL measures flow content without counting its absolute suggestions or clipping them", async () => {
  const app = setup(false, true, "visible"); app.render(); app.set(false);
  app.animations[0].finish(); await Promise.resolve(); app.render(); app.set(true);
  assert.equal(app.animations[1].frames[1].height, "58px");
  assert.equal(app.element.style.overflow, "visible");
  assert.equal(app.animations[1].frames[0].opacity, 0);
  app.h.dispose();
});

test("rapid QL reversal continues from the visible height, opacity and translation", () => {
  const app = setup(false, true, "visible"); app.render(); app.set(false);
  app.visual.height = 37; app.set(true);
  assert.equal(app.animations[1].frames[0].height, "37px");
  assert.equal(app.animations[1].frames[0].opacity, "0.63");
  assert.equal(app.animations[1].frames[0].transform, "matrix(1, 0, 0, 1, 0, -3)");
  app.h.dispose();
});

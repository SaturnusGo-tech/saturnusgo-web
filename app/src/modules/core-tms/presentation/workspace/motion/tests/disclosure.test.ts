import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../../../state/navigation/browser/tests/project/hook-harness";
import type { useDisclosureMotion } from "../../../common/disclosure/useDisclosureMotion";
function setup(reduced = false) {
  const h = hookHarness("https://falcon.test/");
  Object.assign(h.react, { useLayoutEffect: h.react.useEffect });
  Object.assign(h.window, { matchMedia: () => ({ matches: reduced }) });
  const hook = h.load<{ useDisclosureMotion: typeof useDisclosureMotion }>(new URL("../../../common/disclosure/useDisclosureMotion.ts", import.meta.url), () => ({})).useDisclosureMotion;
  let open = true;
  const animations: Array<{ finish: () => void; cancelled: boolean; frames: Keyframe[] }> = [];
  const element = { style: { overflow: "" }, scrollHeight: 100, getBoundingClientRect: () => ({ height: 100 }),
    animate(frames: Keyframe[]) {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => { finish = resolve; });
      const entry = { finish, frames, cancelled: false }; animations.push(entry);
      return { finished, cancel() { entry.cancelled = true; } };
    },
  } as unknown as HTMLDivElement;
  const render = () => h.settle(() => { const result = hook(open); result.ref.current = element; return result; });
  return { h, render, animations, set(value: boolean) { open = value; return render(); } };
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

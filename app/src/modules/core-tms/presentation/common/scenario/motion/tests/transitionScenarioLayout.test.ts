import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { transitionScenarioLayout } from "../transitionScenarioLayout";

const keys = ["document", "matchMedia"] as const;
const originals = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
afterEach(() => {
  Object.defineProperty(globalThis, "matchMedia", { configurable: true, value: () => ({ matches: true }) });
  transitionScenarioLayout(() => {});
  keys.forEach((key, index) => originals[index]
    ? Object.defineProperty(globalThis, key, originals[index]!) : Reflect.deleteProperty(globalThis, key));
});
type Box = { left: number; top: number; width: number; height: number };
function box(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height } as DOMRect;
}
function element(read: () => DOMRect) {
  const animations: Array<{ frames: Keyframe[]; cancelled: boolean; finish(): void }> = [];
  return {
    animations,
    isConnected: true,
    getBoundingClientRect: read,
    querySelectorAll: () => [] as ReturnType<typeof element>[],
    animate(frames: Keyframe[]) {
      let finish!: () => void;
      const finished = new Promise<void>(resolve => { finish = resolve; });
      const record = { frames, cancelled: false, finish }; animations.push(record);
      return { finished, cancel: () => { record.cancelled = true; } } as unknown as Animation;
    },
  };
}
function setup(reduced = false) {
  let grid = false, reads = 0;
  const visual: { root?: Box; part?: Box } = {};
  const part = element(() => {
    reads++;
    return (visual.part ?? (grid ? box(420, 120, 280, 60) : box(140, 180, 560, 40))) as DOMRect;
  });
  const root = element(() => {
    reads++;
    return (visual.root ?? box(100, 100, 600, grid ? 200 : 280)) as DOMRect;
  });
  root.querySelectorAll = () => [part];
  Object.defineProperty(globalThis, "document", { configurable: true, value: { querySelectorAll: () => [root] } });
  Object.defineProperty(globalThis, "matchMedia", { configurable: true, value: () => ({ matches: reduced }) });
  return { root, part, visual, setGrid(value: boolean) { grid = value; }, reads: () => reads };
}

test("scenario fields move from their prior geometry on the same live elements", async () => {
  const h = setup(); let commits = 0;
  transitionScenarioLayout(() => { commits++; h.setGrid(true); });
  assert.equal(commits, 1);
  assert.deepEqual(h.root.animations[0].frames, [{ height: "280px" }, { height: "200px" }]);
  assert.deepEqual(h.part.animations[0].frames, [
    { transform: "translate(-280px, 60px) scale(2, 0.6666666666666666)", transformOrigin: "0 0" },
    { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "0 0" },
  ]);
  h.part.animations[0].finish(); h.root.animations[0].finish();
  await Promise.resolve();
  assert.ok(h.part.animations[0].cancelled); assert.ok(h.root.animations[0].cancelled);
});

test("rapid reversals continue from visual positions and stale completion cannot cancel the replacement", async () => {
  const h = setup();
  transitionScenarioLayout(() => h.setGrid(true));
  h.visual.root = box(100, 100, 600, 240);
  h.visual.part = box(280, 150, 420, 50);
  transitionScenarioLayout(() => {
    assert.ok(h.part.animations[0].cancelled);
    h.setGrid(false); delete h.visual.root; delete h.visual.part;
  });
  assert.deepEqual(h.root.animations[1].frames, [{ height: "240px" }, { height: "280px" }]);
  assert.equal(h.part.animations[1].frames[0].transform, "translate(140px, -30px) scale(0.75, 1.25)");
  h.part.animations[0].finish(); await Promise.resolve();
  assert.equal(h.part.animations[1].cancelled, false);
});

test("reduced motion commits immediately without measuring or animating the scenario", () => {
  const h = setup(true); let committed = false;
  transitionScenarioLayout(() => { h.setGrid(true); committed = true; });
  assert.ok(committed); assert.equal(h.reads(), 0);
  assert.equal(h.root.animations.length, 0); assert.equal(h.part.animations.length, 0);
});

test("unchanged narrow layouts and disconnected content do not receive visual animations", () => {
  const h = setup(); transitionScenarioLayout(() => {});
  assert.equal(h.root.animations.length, 0); assert.equal(h.part.animations.length, 0);
  transitionScenarioLayout(() => { h.setGrid(true); h.root.isConnected = false; });
  assert.equal(h.root.animations.length, 0); assert.equal(h.part.animations.length, 0);
});

test("animation support is optional and application errors remain visible", () => {
  const h = setup();
  Object.defineProperty(h.root, "animate", { value: undefined });
  Object.defineProperty(h.part, "animate", { value() { throw new DOMException("Unavailable"); } });
  let committed = false;
  transitionScenarioLayout(() => { h.setGrid(true); committed = true; });
  assert.ok(committed);
  const failure = new Error("update failed");
  assert.throws(() => transitionScenarioLayout(() => { throw failure; }), error => error === failure);
});

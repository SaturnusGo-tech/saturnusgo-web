import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { transitionContent } from "../transition/content-transition";
const keys = ["document", "matchMedia", "reportError"] as const;
const originals = keys.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
afterEach(() => keys.forEach((key, i) => originals[i] ? Object.defineProperty(globalThis, key, originals[i]!) : Reflect.deleteProperty(globalThis, key)));
function install(start?: (update: () => void) => unknown, reduced = false) {
  const dataset: Record<string, string> = {};
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: { dataset }, startViewTransition: start } });
  Object.defineProperty(globalThis, "matchMedia", { configurable: true, value: () => ({ matches: reduced }) });
  return dataset;
}
function pending() {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => { finish = resolve; });
  return { done, finish };
}
test("unsupported browsers and reduced motion commit synchronously without snapshotting", () => {
  let commits = 0;
  install(); transitionContent(() => commits++);
  install(() => { throw new Error("must not snapshot"); }, true); transitionContent(() => commits++);
  assert.equal(commits, 2);
});
test("rapid navigation skips stale destination callbacks and only the latest transition owns cleanup", async () => {
  const queued: Array<() => void> = [], states: ReturnType<typeof pending>[] = [];
  const commits: number[] = []; let skips = 0;
  const dataset = install((update) => {
    queued.push(update); const state = pending(); states.push(state);
    return { skipTransition() { skips++; }, finished: state.done, updateCallbackDone: Promise.resolve() };
  });
  transitionContent(() => commits.push(1)); transitionContent(() => commits.push(2));
  queued[0](); queued[1](); assert.deepEqual(commits, [2]); assert.equal(skips, 1);
  states[0].finish(); await states[0].done; assert.equal(dataset.falconTransition, "true");
  states[1].finish(); await states[1].done; assert.equal(dataset.falconTransition, undefined);
});
test("snapshot creation failure falls back once, without losing navigation", () => {
  let commits = 0; const dataset = install(() => { throw new DOMException("Unavailable", "InvalidStateError"); });
  transitionContent(() => commits++); assert.equal(commits, 1); assert.equal(dataset.falconTransition, undefined);
});
test("visual cancellation still commits navigation and clears the snapshot marker", async () => {
  let commits = 0;
  const dataset = install((update) => { update(); return { skipTransition() {}, finished: Promise.reject(new DOMException("Skipped", "AbortError")), updateCallbackDone: Promise.resolve() }; });
  transitionContent(() => commits++); await Promise.resolve();
  assert.equal(commits, 1); assert.equal(dataset.falconTransition, undefined);
});
test("application update errors are reported, not disguised as an animation cancellation", async () => {
  const failure = new Error("Application failed"); const errors: unknown[] = [];
  Object.defineProperty(globalThis, "reportError", { configurable: true, value: (error: unknown) => errors.push(error) });
  install((update) => {
    const done = Promise.resolve().then(update);
    return { skipTransition() {}, finished: done, updateCallbackDone: done };
  });
  transitionContent(() => { throw failure; }); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(errors, [failure]);
});

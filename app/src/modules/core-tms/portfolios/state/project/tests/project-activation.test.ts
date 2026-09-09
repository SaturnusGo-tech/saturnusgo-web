import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../tests/support/component-harness";
import type { useProjectActivation } from "../useProjectActivation";

const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
function setup() {
  const harness = componentHarness();
  const hooks = harness.load<{ useProjectActivation: typeof useProjectActivation }>(new URL("../useProjectActivation.ts", import.meta.url));
  return { ...harness, activate: hooks.useProjectActivation };
}
test("cancelled activation cannot start and overwrite a newer project selection", async () => {
  const h = setup(); const calls: string[] = [];
  const activate = async (id: string) => { calls.push(id); return true; };
  h.render(() => h.activate("workspace", "old", activate));
  h.render(() => h.activate("workspace", "new", activate));
  await flush();
  assert.deepEqual(calls, ["new"]);
  assert.equal(h.render(() => h.activate("workspace", "new", activate)).phase, "ready");
});
test("late old responses never mark a different workspace or project ready", async () => {
  const h = setup(); const pending = new Map<string, (ready: boolean) => void>();
  const activate = (id: string) => new Promise<boolean>((resolve) => pending.set(id, resolve));
  h.render(() => h.activate("workspace", "old", activate)); await flush();
  assert.equal(h.render(() => h.activate("other-workspace", "new", activate)).phase, "loading"); await flush();
  pending.get("old")!(true); await flush();
  assert.equal(h.render(() => h.activate("other-workspace", "new", activate)).phase, "loading");
  pending.get("new")!(true); await flush();
  assert.equal(h.render(() => h.activate("other-workspace", "new", activate)).phase, "ready");
});
test("activation failure exposes retry without reloading on inline callback identity changes", async () => {
  const h = setup(); let calls = 0;
  const render = () => h.render(() => h.activate("workspace", "one", async () => { calls++; return calls > 1; }));
  render(); await flush(); assert.equal(render().phase, "error");
  render(); await flush(); assert.equal(calls, 1);
  render().retry(); render(); await flush();
  assert.equal(render().phase, "ready"); assert.equal(calls, 2);
});

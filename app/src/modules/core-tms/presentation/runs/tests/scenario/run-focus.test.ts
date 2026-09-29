import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";

function setup(store = new Map<string, string>()) {
  const h = componentHarness();
  Object.assign(h.window, { localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) } });
  const { useRunFocus } = h.load<{ useRunFocus: (workspaceId: string) => { focused: boolean; ready: boolean; toggle: () => void } }>(new URL("../../execution/useRunFocus.ts", import.meta.url));
  return { h, read: (workspace = "workspace-a") => h.render(() => useRunFocus(workspace)), store };
}

test("run focus is opt-in, persists across mounts and stays scoped to the workspace", () => {
  const first = setup(); first.read();
  assert.equal(first.read().focused, false);
  first.read().toggle(); assert.equal(first.read().focused, true);
  const next = setup(first.store); next.read(); assert.equal(next.read().focused, true);
  next.read("workspace-b"); assert.equal(next.read("workspace-b").focused, false);
  next.read("workspace-a"); next.read().toggle(); assert.equal(next.read().focused, false);
  const restored = setup(first.store); restored.read(); assert.equal(restored.read().focused, false);
});

test("blocked browser storage still allows hide and restore in the current view", () => {
  const { h, read } = setup();
  Object.assign(h.window, { localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } });
  read(); assert.equal(read().ready, true);
  read().toggle(); assert.equal(read().focused, true);
  read().toggle(); assert.equal(read().focused, false);
});

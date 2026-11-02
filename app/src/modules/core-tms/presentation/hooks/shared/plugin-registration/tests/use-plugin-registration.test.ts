import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../../portfolios/tests/support/component-harness";
import type { usePluginRegistration } from "../usePluginRegistration";
type Input = Parameters<typeof usePluginRegistration>[0];
function setup(storage = new Map<string, string>(), initial: Partial<Input> = {}) {
  const timers: { callback(): void; delay: number }[] = [];
  let failStorage = false, failTimer = false;
  const h = componentHarness("https://falcon.test/work/", {
    localStorage: { getItem: (key: string) => { if (failStorage) throw new Error("blocked"); return storage.get(key) ?? null; },
      setItem: (key: string, value: string) => { if (failStorage) throw new Error("blocked"); storage.set(key, value); } },
    setTimeout: (callback: () => void, delay: number) => { if (failTimer) throw new Error("timer unavailable"); timers.push({ callback, delay }); return timers.length; },
    fetch: () => { throw new Error("UI registration cannot make network requests."); },
    Blob: class { constructor() { throw new Error("UI registration cannot create files."); } },
    document: new Proxy({}, { get() { throw new Error("UI registration cannot download or install host software."); } }),
  });
  const { usePluginRegistration: hook } = h.load<{ usePluginRegistration: typeof usePluginRegistration }>(new URL("../usePluginRegistration.ts", import.meta.url));
  let input: Input = { id: "jira", accountKey: "company:qa-one", scopeKey: "workspace-a:project-a", ...initial };
  const render = () => h.render(() => hook(input));
  render(); render();
  return { h, state: render, timers, storage, input: () => input,
    owner: (patch: Partial<Input>) => { input = { ...input, ...patch }; render(); return render(); },
    failStorage: (value: boolean) => { failStorage = value; }, failTimer: (value: boolean) => { failTimer = value; } };
}
test("registration holds Installing for 650ms, deduplicates clicks and records only internal readiness", async () => {
  const h = setup(); assert.equal(h.state().phase, "idle"); assert.equal(h.state().prepared, false);
  const pending = h.state().install(); assert.equal(h.state().phase, "loading"); assert.equal(h.storage.size, 0);
  await h.state().install(); assert.equal(h.timers.length, 1); assert.ok(h.timers[0].delay >= 650);
  assert.equal(h.state().prepared, false); h.timers[0].callback(); await pending;
  assert.equal(h.state().phase, "ready"); assert.equal(h.state().prepared, true);
  assert.deepEqual([...h.storage.values()], ["installed"]);
  const key = [...h.storage.keys()][0]; assert.ok(key.startsWith("falcon.plugin.registration.v1:"));
  assert.deepEqual(JSON.parse(key.slice("falcon.plugin.registration.v1:".length)), [h.input().id, h.input().accountKey, h.input().scopeKey]); h.h.dispose();
});
test("registration survives remount only for the same provider, account and complete scope", async () => {
  const h = setup(); const pending = h.state().install(); h.timers[0].callback(); await pending; const same = { ...h.input() }; h.h.dispose();
  const remounted = setup(h.storage, same); assert.equal(remounted.state().prepared, true);
  for (const patch of [{ id: "github" }, { accountKey: "company:qa-two" }, { scopeKey: "workspace-a:project-b" }]) {
    assert.equal(remounted.owner({ ...same, ...patch }).prepared, false);
  }
  assert.equal(remounted.owner(same).prepared, true); remounted.h.dispose();
});
test("a late registration cannot write after owner changes, unmounts or changes A to B to A", async () => {
  for (const change of ["owner", "unmount", "aba"]) {
    const h = setup(); const original = h.input(); const pending = h.state().install();
    if (change === "unmount") h.h.dispose();
    else { h.owner({ accountKey: "qa-two" }); if (change === "aba") h.owner(original); }
    h.timers[0].callback(); await pending;
    assert.equal(h.storage.size, 0); if (change !== "unmount") { assert.equal(h.state().prepared, false); h.h.dispose(); }
  }
});
test("storage denial keeps registration session-only; an actual transition failure remains retryable", async () => {
  const h = setup(); h.failStorage(true); const pending = h.state().install(); h.timers[0].callback(); await pending;
  assert.equal(h.state().prepared, true); assert.equal(h.storage.size, 0); h.h.dispose();
  const broken = setup(); broken.failTimer(true); await broken.state().install();
  assert.equal(broken.state().phase, "error"); assert.equal(broken.state().prepared, false); assert.equal(broken.storage.size, 0);
  broken.failTimer(false); const retry = broken.state().install(); broken.timers[0].callback(); await retry;
  assert.equal(broken.state().phase, "ready"); broken.h.dispose();
});
test("incomplete scope cannot register and delimiter-like identifiers cannot collide", async () => {
  for (const missing of [{ id: "" }, { accountKey: " " }, { scopeKey: "" }]) {
    const h = setup(new Map(), missing); await h.state().install(); assert.equal(h.timers.length, 0); assert.equal(h.state().prepared, false); h.h.dispose();
  }
  const h = setup(new Map(), { id: "a:b", accountKey: "c", scopeKey: "d" }); const pending = h.state().install(); h.timers[0].callback(); await pending;
  assert.equal(h.owner({ id: "a", accountKey: "b:c" }).prepared, false); h.h.dispose();
});

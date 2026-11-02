import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import type { useCodexInstall } from "../../presentation/setup/installation/useCodexInstall";
import { status } from "../support/employee-fixture";
function installHarness(storage = new Map<string, string>()) {
  const timers: (() => void)[] = [], delays: number[] = [], jobs: { setup: CodexEmployee["setup"]; resolve(): void; reject(error: Error): void }[] = [];
  const h = componentHarness("https://company.test/work/", { localStorage: { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); } },
    setTimeout: (callback: () => void, delay: number) => { timers.push(callback); delays.push(delay); return timers.length; },
    document: new Proxy({}, { get() { throw new Error("Registration cannot use DOM file downloads."); } }),
    Blob: class { constructor() { throw new Error("Registration cannot create files."); } },
    fetch: () => { throw new Error("Registration cannot send network requests."); } });
  const { useCodexInstall: hook } = h.load<{ useCodexInstall: typeof useCodexInstall }>(new URL("../../presentation/setup/installation/useCodexInstall.ts", import.meta.url), name => {
    if (name.endsWith("prepareCodexInstallation")) return { prepareCodexInstallation: (configuration: CodexEmployee["setup"]) =>
      new Promise<void>((resolve, reject) => jobs.push({ setup: configuration, resolve, reject })) };
    if (name.endsWith("codex-plugin")) return { CODEX_PLUGIN_VERSION: "0.3.0" };
  });
  let configuration: CodexEmployee["setup"] | undefined = { ...status.setup, scopes: [...status.setup.scopes] }, account = "company-a:qa-one";
  const render = () => h.render(() => hook(configuration, account));
  render(); render();
  const flush = () => new Promise<void>(resolve => setImmediate(resolve));
  const finish = async (index: number) => { jobs[index].resolve(); await flush(); timers.splice(0).forEach(callback => callback()); };
  return { h, jobs, timers, delays, storage, state: render, finish, flush,
    owner: (setup: typeof configuration, key = account) => { configuration = setup; account = key; render(); return render(); } };
}
test("internal registration stays Installing until validation and transition finish, then records installed without file or network APIs", async () => {
  const h = installHarness(); assert.equal(h.state().phase, "idle"); assert.equal(h.state().prepared, false);
  const pending = h.state().install(); assert.equal(h.state().phase, "loading"); assert.equal(h.storage.size, 0);
  await h.state().install(); assert.equal(h.jobs.length, 1);
  h.jobs[0].resolve(); await h.flush(); assert.equal(h.state().phase, "loading"); assert.equal(h.storage.size, 0);
  assert.ok(h.delays.length && h.delays.every(delay => delay >= 650));
  h.timers.splice(0).forEach(callback => callback()); await pending;
  assert.equal(h.state().phase, "ready"); assert.equal(h.state().prepared, true);
  assert.deepEqual([...h.storage.values()], ["installed"]); h.h.dispose();
});
test("failed validation records no registered state and can be retried", async () => {
  const h = installHarness(); const pending = h.state().install(); h.jobs[0].reject(new Error("failed")); await pending;
  assert.equal(h.state().phase, "error"); assert.equal(h.state().prepared, false); assert.equal(h.storage.size, 0);
  const retry = h.state().install(); await h.finish(1); await retry;
  assert.equal(h.state().phase, "ready"); assert.deepEqual([...h.storage.values()], ["installed"]); h.h.dispose();
});
test("registration is scoped to account and every setup field, not just the MCP URL", async () => {
  const h = installHarness(); const pending = h.state().install(); await h.finish(0); await pending;
  assert.equal(h.state().prepared, true);
  assert.equal(h.owner(status.setup, "company-a:qa-two").prepared, false);
  assert.equal(h.owner(status.setup, "company-a:qa-one").prepared, true);
  const variants: CodexEmployee["setup"][] = [{ ...status.setup, scopes: ["falcon:read", "falcon:cases:write"] },
    { ...status.setup, resource: "https://company.test/api/v2/mcp" }, { ...status.setup, oauthIssuer: "https://company.test/api/v2/oauth" },
    { ...status.setup, mcpUrl: "https://other-company.test/api/v1/mcp" }];
  for (const value of variants) assert.equal(h.owner(value).prepared, false);
  assert.equal(h.owner(status.setup).prepared, true); assert.equal(h.owner(undefined).prepared, false); h.h.dispose();
});
test("changing owner or unmounting prevents late registration from recording readiness", async () => {
  for (const unmount of [false, true]) {
    const h = installHarness(); const pending = h.state().install();
    if (unmount) h.h.dispose(); else h.owner({ ...status.setup, mcpUrl: "https://another.test/api/v1/mcp" }, "another:qa");
    await h.finish(0); await pending;
    assert.equal(h.storage.size, 0); if (!unmount) h.h.dispose();
  }
});
test("returning to a previous owner cannot resurrect its cancelled in-flight registration", async () => {
  const h = installHarness(); const pending = h.state().install();
  h.owner(status.setup, "company-a:qa-two"); h.owner(status.setup, "company-a:qa-one");
  await h.finish(0); await pending;
  assert.equal(h.storage.size, 0); assert.equal(h.state().prepared, false); h.h.dispose();
});
test("the former package-download marker is never treated as an installed integration", () => {
  const old = new Map([[`falcon.codex.package.v1:company-a:qa-one:${JSON.stringify(status.setup)}:0.3.0`, "prepared"]]);
  const h = installHarness(old); assert.equal(h.state().phase, "idle"); assert.equal(h.state().prepared, false); h.h.dispose();
});

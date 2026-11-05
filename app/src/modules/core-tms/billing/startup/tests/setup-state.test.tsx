import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useStartupSetup } from "../application/useStartupSetup";
import type { StartupSetup, StartupSetupPort } from "../domain/startup-setup";
const draft = { id: "draft", version: 1, displayName: "Team", slug: "team", hostname: "team-falcon.saturnusgo.com", status: "ready", expiresAt: "2026-11-06T12:30:00Z" } as StartupSetup;
let current: ReturnType<typeof useStartupSetup>;
function Probe({ port, workspaceId = "one", enabled = true }: { port: StartupSetupPort; workspaceId?: string; enabled?: boolean }) {
  current = useStartupSetup(port, workspaceId, enabled); return null;
}
const port = (overrides: Partial<StartupSetupPort> = {}): StartupSetupPort => ({ read: async () => draft, save: async () => draft, retry: async () => draft, ...overrides });
test("setup does not read or mutate without server-authorized billing access", async () => {
  let calls = 0; const api = port({ read: async () => { calls++; return draft; }, save: async () => { calls++; return draft; } });
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={api} enabled={false} />); });
  await act(async () => { await current.save({ displayName: "Team", slug: "team" }); });
  assert.equal(calls, 0); assert.equal(current.setup, null); await act(async () => view.unmount());
});
test("switching workspace aborts old setup and hides late responses", async () => {
  let resolve!: (value: StartupSetup) => void, signal: AbortSignal | undefined;
  const pending = new Promise<StartupSetup>(done => { resolve = done; });
  const api = port({ read: async (id, input) => { if (id === "one") { signal = input; return pending; } return { ...draft, id: "second" }; } });
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={api} />); });
  await act(async () => { view.update(<Probe port={api} workspaceId="two" />); });
  assert.equal(signal?.aborted, true); assert.equal(current.setup?.id, "second");
  await act(async () => { resolve(draft); }); assert.equal(current.setup?.id, "second"); await act(async () => view.unmount());
});
test("safe field errors stay with the form and failed provisioning has an explicit versioned retry", async () => {
  let retryVersion: number | null = null;
  const api = port({ read: async () => ({ ...draft, status: "failed", version: 4 }), save: async () => { throw { code: "STARTUP_SLUG_UNAVAILABLE", status: 409 }; }, retry: async (_id, version) => { retryVersion = version; return draft; } });
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={api} />); });
  await act(async () => { await current.save({ displayName: "Team", slug: "taken" }); });
  assert.equal(current.error?.code, "STARTUP_SLUG_UNAVAILABLE"); assert.equal(current.setup?.status, "failed");
  await act(async () => { await current.retry(); }); assert.equal(retryVersion, 4); assert.equal(current.setup?.status, "ready"); await act(async () => view.unmount());
});
test("an uncertain save retry reuses the original version and idempotency key", async () => {
  const keys: string[] = []; let writes = 0;
  const api = port({ save: async (_id, _input, _version, key) => { keys.push(key); if (++writes === 1) throw new TypeError("lost response"); return draft; } });
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={api} />); });
  await act(async () => { await current.save({ displayName: "Team", slug: "team" }); });
  assert.equal(current.canRetryCommand, true);
  await act(async () => { await current.retryCommand(); }); assert.equal(keys.length, 2); assert.equal(keys[0], keys[1]); await act(async () => view.unmount());
});

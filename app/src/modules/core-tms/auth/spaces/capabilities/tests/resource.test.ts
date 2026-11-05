import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkspaceCapabilityResource } from "../application/workspace-capability-resource";
import type { WorkspaceCapabilities } from "../domain/workspace-capabilities";
const capabilities = { workspaceId: "space", teamAdministrationAvailable: true, canConnect: true, status: "available" } as WorkspaceCapabilities;
const flush = () => new Promise(resolve => setImmediate(resolve));
test("shared consumers use one read and refresh revokes cached privileges until reauthorized", async () => {
  let reads = 0;
  const resource = createWorkspaceCapabilityResource(async () => { reads++; return capabilities; }, "space");
  const first = resource.subscribe(() => {}), second = resource.subscribe(() => {});
  await flush(); assert.equal(reads, 1); assert.equal(resource.snapshot().value?.teamAdministrationAvailable, true);
  resource.refresh(); assert.equal(resource.snapshot().value, null); await flush(); assert.equal(reads, 2);
  first(); second(); assert.equal(resource.snapshot().value, null);
});
test("aborted capability responses cannot restore privileges after unsubscribe", async () => {
  let resolve!: (value: WorkspaceCapabilities) => void; let signal: AbortSignal | undefined;
  const resource = createWorkspaceCapabilityResource(async (_workspace, input) => { signal = input; return new Promise(done => { resolve = done; }); }, "space");
  const stop = resource.subscribe(() => {}); stop(); assert.equal(signal?.aborted, true);
  resolve(capabilities); await flush(); assert.equal(resource.snapshot().value, null);
});
test("server permission denial fails closed without a session-kind fallback", async () => {
  const resource = createWorkspaceCapabilityResource(async () => { throw { code: "FORBIDDEN" }; }, "space");
  const stop = resource.subscribe(() => {}); await flush(); assert.equal(resource.snapshot().value, null); assert.equal(resource.snapshot().error, "FORBIDDEN"); stop();
});

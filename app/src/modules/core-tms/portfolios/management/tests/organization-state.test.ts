import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../tests/support/component-harness";
import { resolvePendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { validChecklist } from "../model/organization";
import type { usePortfolioCommand } from "../../state/command/usePortfolioCommand";
import type { useOrganizationManagement } from "../state/useOrganizationManagement";
function setup(write: (etag: string, key: string, signal: AbortSignal) => Promise<unknown>) {
  const h = componentHarness(); const saved: unknown[] = [];
  const command = h.load<{ usePortfolioCommand: typeof usePortfolioCommand }>(new URL("../../state/command/usePortfolioCommand.ts", import.meta.url), (name) => {
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("mutation-failure")) return { toTmsMutationFailure };
  });
  const hook = h.load<{ useOrganizationManagement: typeof useOrganizationManagement }>(new URL("../state/useOrganizationManagement.ts", import.meta.url), (name) => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("usePortfolioCommand")) return command;
    if (name.endsWith("organization-api")) return { patchOrganization: (_http: unknown, _target: unknown, _patch: unknown, etag: string, key: string, signal: AbortSignal) => write(etag, key, signal) };
    if (name.endsWith("model/organization")) return { validChecklist };
  });
  return { ...h, saved, run: (id = "one", etag: string | null = '"v1"', status = "active", canManage = true) => h.render(() =>
    hook.useOrganizationManagement({ workspaceId: "workspace", targetType: "portfolio", targetId: id }, { data: { status }, etag }, canManage, (result) => saved.push(result), () => {})) };
}
test("same failed workflow change retries with same key; refreshed version requires a new explicit command", async () => {
  const calls: { etag: string; key: string }[] = [];
  const h = setup(async (etag, key) => { calls.push({ etag, key }); if (calls.length === 1) throw new Error("Conflict"); return { kind: "portfolio", data: {}, etag: '"v2"' }; });
  assert.equal(await h.run().save({ workflowPhase: "done" }), false);
  assert.equal(await h.run().save({ workflowPhase: "done" }), true);
  assert.equal(calls[0].key, calls[1].key);
  assert.equal(await h.run("one", '"v2"').save({ workflowPhase: "in_review" }), true);
  assert.notEqual(calls[1].key, calls[2].key); assert.equal(calls[2].etag, '"v2"');
});
test("scope changes cancel pending organization writes and never accept a late resource", async () => {
  let resolve!: (value: unknown) => void; let signal!: AbortSignal;
  const h = setup((_etag, _key, active) => { signal = active; return new Promise((done) => { resolve = done; }); });
  const pending = h.run().save({ checklist: [] }); h.run("two");
  assert.equal(signal.aborted, true); resolve({ kind: "portfolio", data: {} });
  assert.equal(await pending, false); assert.equal(h.saved.length, 0);
});
test("archive, missing version, and permissions block mutations", async () => {
  let calls = 0; const h = setup(async () => { calls++; return {}; });
  assert.equal(await h.run("one", null).save({ checklist: [] }), false);
  assert.equal(await h.run("one", '"v1"', "archived").save({ workflowPhase: "new" }), false);
  assert.equal(await h.run("one", '"v1"', "active", false).save({ workflowPhase: "new" }), false);
  assert.equal(calls, 0);
});

import type { useResource } from "../../state/detail/useResource";
test("same-scope refresh retains detail state on loading/failure; accepted writes abort stale reads", async () => {
  const h = componentHarness();
  const resource = h.load<{ useResource: typeof useResource }>(new URL("../../state/detail/useResource.ts", import.meta.url), (name) => {
    if (name.endsWith("mutation-failure")) return { toTmsMutationFailure };
  });
  const reads: { resolve: (value: { etag: string }) => void; reject: (error: Error) => void; signal: AbortSignal }[] = [];
  const run = (scope = "one") => h.render(() => resource.useResource(scope, true, (signal) => new Promise<{ etag: string }>((resolve, reject) => reads.push({ resolve, reject, signal }))));
  run(); reads[0].resolve({ etag: "v1" }); await new Promise((done) => setImmediate(done));
  run().reload(); run(); let state = run();
  assert.equal(state.data?.etag, "v1"); assert.equal(state.loading, true);
  reads[1].reject(new Error("Offline")); await new Promise((done) => setImmediate(done)); state = run();
  assert.equal(state.data?.etag, "v1"); assert.ok(state.error);
  state.reload(); run(); state = run(); state.accept({ etag: "v3" });
  assert.equal(reads[2].signal.aborted, true); reads[2].resolve({ etag: "v2" });
  await new Promise((done) => setImmediate(done)); assert.equal(run().data?.etag, "v3");
  assert.equal(run("two").data, null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import type { useBatchComposer } from "../../../batches/state/composer/useBatchComposer";
import type { Bootstrap, Project } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RunBatchRequest } from "../../../batches/model/batch";
import { resolvePendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { tick } from "../support/build-fixture";

function fixture() {
  const h = componentHarness(); const http = {}; const calls: { body: RunBatchRequest; key: string }[] = [];
  let failure: unknown; let invalid = ""; let uploading = false;
  const protectedScopes: string[][] = []; const outcomes: string[] = [];
  const { useBatchComposer: useComposer } = h.load<{ useBatchComposer: typeof useBatchComposer }>(
    new URL("../../../batches/state/composer/useBatchComposer.ts", import.meta.url), (name) => {
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
      if (name.endsWith("pending-operation")) return { resolvePendingOperation };
      if (name.endsWith("transport/http")) return { TmsApiError };
      if (name.endsWith("test-case-api")) return { listTestCases: async (_http: unknown, projectId: string) => ({ items: [{ id: `case-${projectId}`, projectId }] }) };
      if (name.endsWith("folder-api")) return { listFolders: async () => [] };
      if (name.endsWith("mutation-failure")) return { toTmsMutationFailure: (error: unknown) => error, formatTmsMutationFailure: () => "Creation failed" };
      if (name.endsWith("useRunPlatformBuilds")) return { useRunPlatformBuilds: () => ({
        uploading, validate: () => invalid,
        selection: (id: string) => id === "a" ? [{ platform: "android", attachmentId: "artifact-a", version: "42" }] : [{ platform: "ios", reference: "TestFlight 42" }],
        beginSubmission: (ids: string[]) => { protectedScopes.push(ids); return ["artifact-a"]; },
        settleSubmission: (_ids: string[], outcome: string) => { outcomes.push(outcome); },
      }) };
      if (name.endsWith("batch-api")) return { listRunIterations: async () => [],
        createRunBatch: async (_http: unknown, _workspace: string, body: RunBatchRequest, key: string) => {
          calls.push({ body, key }); if (failure) throw failure; return { runs: [] };
        } };
    });
  const project = { id: "a" } as Project; const data = { workspace: { id: "workspace" } } as Bootstrap;
  const render = () => h.render(() => useComposer(data, project, ["case-a", "case-b"], false, false));
  async function prepare() { render().setProjectIds(["a", "b"]); render(); await tick(); render().setName("Release"); render().setBuild("legacy-42"); return render(); }
  return { h, calls, outcomes, protectedScopes, render, prepare,
    fail: (error: unknown) => { failure = error; }, invalid: (error: string) => { invalid = error; }, uploading: (value: boolean) => { uploading = value; } };
}

test("batch submission binds platform builds to each selection and preserves legacy build/idempotency", async () => {
  const f = fixture(); await f.prepare(); await f.render().submit(); await f.render().submit();
  assert.equal(f.calls[0].body.build, "legacy-42"); assert.equal(f.calls[0].key, f.calls[1].key);
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0].body.selections)), [
    { projectId: "a", platformBuilds: [{ platform: "android", attachmentId: "artifact-a", version: "42" }], caseIds: ["case-a"] },
    { projectId: "b", platformBuilds: [{ platform: "ios", reference: "TestFlight 42" }], caseIds: ["case-b"] },
  ]);
  assert.deepEqual([...f.protectedScopes[0]], ["a", "b"]); assert.equal(f.outcomes[0], "saved"); f.h.dispose();
});

test("unfinished or missing Android files block creation before artifact protection", async () => {
  const f = fixture(); await f.prepare(); f.invalid("Upload the Android file");
  assert.equal(await f.render().submit(), null); assert.match(f.render().error, /Upload/);
  f.invalid(""); f.uploading(true); assert.equal(await f.render().submit(), null);
  assert.equal(f.calls.length, 0); assert.equal(f.protectedScopes.length, 0); f.h.dispose();
});

test("run owner is sent independently without overriding case assignees", async () => {
  const f = fixture(); await f.prepare();
  f.render().setOwnerIdentityId("qa-lead");
  f.render().setTags("release, mobile, release");
  await f.render().submit();
  assert.equal(f.calls[0].body.ownerIdentityId, "qa-lead");
  assert.equal(Object.prototype.hasOwnProperty.call(f.calls[0].body, "assigneeIdentityId"), false);
  assert.deepEqual([...f.calls[0].body.iteration!.tags!], ["release", "mobile"]);
  f.render().setOwnerIdentityId(null); await f.render().submit();
  assert.equal(f.calls[1].body.ownerIdentityId, null);
  assert.equal(Object.prototype.hasOwnProperty.call(f.calls[1].body, "assigneeIdentityId"), false);
  assert.notEqual(f.calls[0].key, f.calls[1].key);
  f.h.dispose();
});

test("failed batch requests distinguish definite rejection from an uncertain response", async () => {
  for (const [error, outcome] of [[new TmsApiError("Invalid", 422, null, "VALIDATION_ERROR"), "rejected"], [new Error("Network"), "uncertain"]] as const) {
    const f = fixture(); await f.prepare(); f.fail(error); assert.equal(await f.render().submit(), null);
    assert.deepEqual(f.outcomes, [outcome]); assert.ok(f.render().error); f.h.dispose();
  }
});

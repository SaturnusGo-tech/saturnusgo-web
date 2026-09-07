import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { ExecutionStatus } from "../../../../../core/tms/contracts/legacy-contract";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createRunItemMutationQueue } from "../../../state/run-actions/run-item-mutation-queue";
import { createRunStepWriter } from "./saveRunStep";
import { item, response, run } from "./fixtures/step-fixture";

const defaults = { failure: "Observed mismatch", blocked: "Dependency unavailable" };
for (const status of ["passed", "failed", "blocked"] as const) {
  test(`saves independent actual evidence for ${status} without changing case outcome or old attempts`, async () => {
    const calls: RequestInit[] = [];
    const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
      accessToken: async () => "synthetic-token", fetch: (async (url, init = {}) => {
        assert.equal(new URL(String(url)).pathname, `/api/v1/runs/${run.id}/items/item-1/steps/step-1`);
        calls.push(init); return response(JSON.parse(String(init.body)));
      }) as typeof fetch });
    const before = item(); const original = structuredClone(before);
    const queue = createRunItemMutationQueue<typeof before>();
    queue.sync({ data: before, etag: '"item-1:1"' });
    const writer = createRunStepWriter(http, () => "save-actual-key");
    const saved = await queue.run(before.id, (resource) => writer.write({ run, resource,
      stepId: "step-1", status, actualResult: "Checked immutable commit 20d13e9; actual source differs from expected prose", defaults }));
    assert.equal(calls.length, 1); assert.equal(calls[0]?.method, "PATCH");
    const headers = new Headers(calls[0]?.headers);
    assert.equal(headers.get("if-match"), '"item-1:1"');
    assert.equal(headers.get("idempotency-key"), "save-actual-key");
    assert.equal(headers.get("authorization"), "Bearer synthetic-token");
    const actual = saved.data.attempts[0]!.stepResults[0]!;
    assert.equal(actual.status, status); assert.match(actual.actualResult, /20d13e9/);
    assert.equal(actual.comment, status === "blocked" ? defaults.blocked : "");
    assert.equal(saved.data.status, "in_progress");
    assert.deepEqual(saved.data.snapshot, original.snapshot);
    assert.deepEqual(saved.data.attempts[1], original.attempts[1]);
    assert.deepEqual(before, original);
  });
}

test("lost save response keeps the operation key and evidence; an explicit changed save gets a new key", async () => {
  const calls: RequestInit[] = []; let keys = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "synthetic-token",
    fetch: (async (_url, init = {}) => { calls.push(init);
      if (calls.length === 1) throw new TypeError("response lost after write");
      return response(JSON.parse(String(init.body)), calls.length);
    }) as typeof fetch });
  const writer = createRunStepWriter(http, () => `save-${++keys}`);
  const input = { run, resource: { data: item(), etag: '"item-1:1"' }, stepId: "step-1",
    status: "passed" as const, actualResult: "Actual SHA A", defaults };
  await assert.rejects(writer.write(input));
  assert.equal(calls.length, 1, "No automatic replay after an unknown outcome");
  const saved = await writer.write(input);
  assert.equal(new Headers(calls[0]?.headers).get("idempotency-key"), new Headers(calls[1]?.headers).get("idempotency-key"));
  assert.equal(calls[0]?.body, calls[1]?.body);
  await writer.write({ ...input, resource: saved, actualResult: "Actual SHA B" });
  assert.equal(new Headers(calls[2]?.headers).get("if-match"), '"item-1:2"');
  assert.notEqual(new Headers(calls[1]?.headers).get("idempotency-key"), new Headers(calls[2]?.headers).get("idempotency-key"));
});

test("terminal attempts, archived/completed runs and missing ETags never send a save", async () => {
  let calls = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "synthetic-token",
    fetch: (async () => { calls += 1; throw new Error("Must not write"); }) as typeof fetch });
  const writer = createRunStepWriter(http);
  const input = { run, resource: { data: item(), etag: '"item-1:1"' }, stepId: "step-1",
    status: "passed" as const, actualResult: "Do not alter history", defaults };
  for (const status of ["passed", "failed", "blocked", "skipped"] as ExecutionStatus[]) {
    const terminal = item(); terminal.status = status; terminal.attempts[0]!.status = status;
    await assert.rejects(writer.write({ ...input, resource: { ...input.resource, data: terminal } }));
  }
  for (const status of ["draft", "completed", "aborted"] as const) await assert.rejects(writer.write({ ...input, run: { ...run, status } }));
  await assert.rejects(writer.write({ ...input, run: { ...run, archivedAt: run.createdAt } }));
  await assert.rejects(writer.write({ ...input, resource: { ...input.resource, etag: null } }));
  assert.equal(calls, 0);
});

test("a response targeting a historical attempt is rejected before changing the current resource", async () => {
  const before = item(); const original = structuredClone(before);
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "synthetic-token",
    fetch: (async (_url, init = {}) => response(JSON.parse(String(init.body)), 2, 1)) as typeof fetch });
  await assert.rejects(createRunStepWriter(http).write({ run, resource: { data: before, etag: '"item-1:1"' },
    stepId: "step-1", status: "passed", actualResult: "Actual SHA", defaults }));
  assert.deepEqual(before, original);
});

test("blank custom failure evidence is not silently replaced with generic text", async () => {
  let calls = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "synthetic-token",
    fetch: (async (_url, init = {}) => { calls += 1; return response(JSON.parse(String(init.body))); }) as typeof fetch });
  const writer = createRunStepWriter(http);
  const input = { run, resource: { data: item(), etag: '"item-1:1"' },
    stepId: "step-1", status: "failed" as const, defaults };
  await assert.rejects(writer.write({ ...input, actualResult: "   " }));
  assert.equal(calls, 0);
  const marked = await writer.write(input);
  assert.equal(marked.data.attempts[0]!.stepResults[0]!.actualResult, defaults.failure);
});

test("actual editor deliberately saves on blur/click, guards dirty completion and keeps an independent draft", () => {
  const editor = readFileSync(new URL("../../../presentation/runs/actual/StepActualEditor.tsx", import.meta.url), "utf8");
  const view = readFileSync(new URL("../../../presentation/runs/RunsView.tsx", import.meta.url), "utf8");
  assert.match(editor, /onBlur=\{\(\) => void save\(\)\}/);
  assert.match(editor, /onClick=\{\(\) => void save\(\)\}/);
  assert.match(editor, /readOnly=\{pending\}/);
  assert.match(editor, /await onSave\(draft\)/);
  assert.match(editor, /if \(!dirty \|\| inFlight\.current\) return/);
  assert.match(view, /\["passed", "failed", "blocked"\]\.includes\(status\) && attemptWritable/);
  assert.match(view, /runWritable: attemptWritable && dirtySteps\.length === 0/);
  assert.match(view, /currentEditScope\.current === editScope/);
});

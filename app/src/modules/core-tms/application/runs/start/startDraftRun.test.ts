import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { canStartDraftRun, createDraftRunStarter } from "./startDraftRun";
import { active, dto, input, response, stale, transport } from "./fixtures/start-fixture";

test("starts the existing draft with its ETag and no empty JSON body", async () => {
  const { http, calls } = transport([active]);
  const result = await createDraftRunStarter(http, () => "start-one").start(input);
  assert.equal(result.data.id, input.run.id);
  assert.equal(result.data.status, "active");
  assert.deepEqual(calls, [{ path: "/api/v1/runs/run-1/start", method: "POST",
    etag: '"run-1:1"', key: "start-one", contentType: null, body: undefined }]);
});

test("a lost acceptance retries the original key and ETag even after a newer ETag is supplied", async () => {
  const { http, calls } = transport([() => { throw new TypeError("Connection lost"); }, active]);
  let keys = 0;
  const starter = createDraftRunStarter(http, () => `key-${++keys}`);
  await assert.rejects(starter.start(input), /Connection lost/);
  const result = await starter.start({ ...input, etag: '"run-1:99"' });
  assert.equal(result.data.status, "active");
  assert.deepEqual(calls.map(({ key, etag }) => [key, etag]),
    [["key-1", '"run-1:1"'], ["key-1", '"run-1:1"']]);
  assert.equal(keys, 1);
});

test("concurrent Start clicks share one actual HTTP mutation", async () => {
  let release!: (value: Response) => void;
  const { http, calls } = transport([() => new Promise((resolve) => { release = resolve; })]);
  const starter = createDraftRunStarter(http, () => "shared-key");
  const first = starter.start(input);
  const second = starter.start(input);
  assert.equal(first, second);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  release(active());
  assert.equal((await second).data.status, "active");
});

test("a missing ETag loads and validates the authoritative draft before starting", async () => {
  const { http, calls } = transport([() => response(dto, '"run-1:4"'), active]);
  await createDraftRunStarter(http, () => "fresh-key").start({ ...input, etag: null });
  assert.deepEqual(calls.map(({ method, etag }) => [method, etag]),
    [["GET", null], ["POST", '"run-1:4"']]);
});

test("one definite 412 gets a new scoped ETag and key, then retries once", async () => {
  const { http, calls } = transport([stale, () => response(dto, '"run-1:7"'), active]);
  let keys = 0;
  await createDraftRunStarter(http, () => `key-${++keys}`).start(input);
  assert.deepEqual(calls.map(({ method, key, etag }) => [method, key, etag]), [
    ["POST", "key-1", '"run-1:1"'], ["GET", null, null], ["POST", "key-2", '"run-1:7"'],
  ]);
});

test("a second 412 ends recovery rather than issuing an unbounded loop", async () => {
  const { http, calls } = transport([stale, () => response(dto, '"run-1:7"'), stale]);
  await assert.rejects(createDraftRunStarter(http).start(input),
    (error) => error instanceof TmsApiError && error.status === 412);
  assert.equal(calls.length, 3);
});

test("an already active authoritative run is reconciled without a second Start", async () => {
  for (const missing of [true, false]) {
    const { http, calls } = transport(missing ? [active] : [stale, active]);
    const result = await createDraftRunStarter(http).start({ ...input,
      etag: missing ? null : input.etag });
    assert.equal(result.data.status, "active");
    assert.equal(calls.filter((call) => call.method === "POST").length, missing ? 0 : 1);
  }
});

test("archive, foreign scope, missing ETag and changed status fail closed after a stale response", async () => {
  const replacements = [
    () => response({ ...dto, archivedAt: dto.createdAt }),
    () => response({ ...dto, projectId: "other-project" }),
    () => response({ ...dto, id: "other-run" }),
    () => response(dto, null),
    () => response({ ...dto, status: "completed" }),
  ];
  for (const replacement of replacements) {
    const { http, calls } = transport([stale, replacement]);
    await assert.rejects(createDraftRunStarter(http).start(input));
    assert.deepEqual(calls.map((call) => call.method), ["POST", "GET"]);
  }
});

test("missing permissions, disconnected, foreign, archived, empty and terminal drafts never request HTTP", async () => {
  const variants = [
    { ...input, connected: false }, { ...input, canManage: false },
    { ...input, projectId: "other-project" },
    { ...input, run: { ...input.run, archivedAt: dto.createdAt } },
    { ...input, run: { ...input.run, itemCount: 0 } },
    { ...input, run: { ...input.run, status: "active" as const } },
    { ...input, run: { ...input.run, status: "completed" as const } },
    { ...input, run: { ...input.run, status: "aborted" as const } },
  ];
  const { http, calls } = transport([]);
  const starter = createDraftRunStarter(http);
  for (const invalid of variants) {
    assert.equal(canStartDraftRun(invalid), false);
    await assert.rejects(starter.start(invalid), /unavailable/);
  }
  assert.equal(calls.length, 0);
});

test("an aborted owner cannot publish its result; returning later replays the exact operation", async () => {
  const controller = new AbortController();
  const { http, calls } = transport([() => { controller.abort(); return active(); }, active]);
  const starter = createDraftRunStarter(http, () => "aborted-acceptance");
  await assert.rejects(starter.start({ ...input, signal: controller.signal }),
    (error) => error instanceof DOMException && error.name === "AbortError");
  await starter.start({ ...input, etag: '"run-1:99"' });
  assert.deepEqual(calls.map(({ key, etag }) => [key, etag]), [
    ["aborted-acceptance", '"run-1:1"'], ["aborted-acceptance", '"run-1:1"'],
  ]);
});

test("an invalid success response is not accepted and the original request remains replayable", async () => {
  const { http, calls } = transport([
    () => response({ ...dto, status: "active", projectId: "foreign" }), active,
  ]);
  const starter = createDraftRunStarter(http, () => "scope-check");
  await assert.rejects(starter.start(input), /scope/);
  await starter.start(input);
  assert.equal(calls[0].key, calls[1].key);
  assert.equal(calls[0].etag, calls[1].etag);
});

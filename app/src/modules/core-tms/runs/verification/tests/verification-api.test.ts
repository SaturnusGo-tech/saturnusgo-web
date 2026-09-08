import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient, TmsApiError } from "../../../../../core/tms/transport/http";
import { collectRunVerification, collectVerificationQueue } from "../application/collect-verification-entries";
import { createVerificationRun, getRunVerification, getVerificationQueue } from "../data/verification-api";
import { entry, queue, request, run } from "./fixtures/verification-fixture";
import { buildVerificationRunRequest } from "../application/request/build-verification-run-request";

test("queue counts come from the complete server scope, not the first page entries", async () => {
  let url = "";
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "qa-token",
    fetch: (async (input) => { url = String(input); return new Response(JSON.stringify(queue)); }) as typeof fetch });
  const result = await getVerificationQueue(http, "project-1");
  assert.equal(url, "https://api.example.test/api/v1/projects/project-1/verification-queue?offset=0&limit=50");
  assert.equal(result.data.totalCases, 70);
  assert.equal(result.data.entries.length, 1);
});

test("opening queue detail loads every page with unchanged scope and keeps excluded cases visible", async () => {
  const offsets: number[] = [];
  const result = await collectVerificationQueue(async (offset) => {
    offsets.push(offset);
    return offset === 0 ? { ...queue, meta: { ...queue.meta, hasMore: true, nextOffset: 50 } }
      : { data: { ...queue.data, entries: [{ ...entry, defectId: "bug-2", occurrenceId: null, caseId: null,
        caseKey: null, caseTitle: null, caseRevision: null, blockedReason: "no_linked_case" }] },
        meta: { ...queue.meta, offset: 50 } };
  });
  assert.deepEqual(offsets, [0, 50]);
  assert.equal(result.entries.length, 2);
  assert.equal(result.entries[1]?.blockedReason, "no_linked_case");
  assert.equal(result.totalCases, 70);
});

test("moving verification scope and nonadvancing pagination are rejected", async () => {
  await assert.rejects(collectVerificationQueue(async (offset) => offset === 0
    ? { ...queue, meta: { ...queue.meta, hasMore: true, nextOffset: 50 } }
    : { ...queue, data: { ...queue.data, scopeToken: "b".repeat(64) } }),
  (error: unknown) => error instanceof TmsApiError && error.status === 409);
  await assert.rejects(collectVerificationQueue(async () => ({ ...queue,
    meta: { ...queue.meta, hasMore: true, nextOffset: 0 } })), /pagination did not advance/);
});

test("run context carries the selected case filter across every page", async () => {
  const urls: string[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "qa-token",
    fetch: (async (input) => { urls.push(String(input)); return new Response(JSON.stringify({
      data: [{ ...entry, runItemId: "item-1", currentStatus: "reopened", readinessChanged: true }],
      meta: { offset: urls.length === 1 ? 0 : 50, limit: 50, hasMore: urls.length === 1, nextOffset: urls.length === 1 ? 50 : null },
    })); }) as typeof fetch });
  const entries = await collectRunVerification((offset) => getRunVerification(http, "run-1", "case-1", offset));
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.readinessChanged, true);
  assert.deepEqual(urls.map((url) => new URL(url).searchParams.get("caseId")), ["case-1", "case-1"]);
  assert.deepEqual(urls.map((url) => new URL(url).searchParams.get("offset")), ["0", "50"]);
});

test("verification run uses existing run mapping and scoped idempotent mutation", async () => {
  let mutation: RequestInit | undefined;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "qa-token",
    fetch: (async (_input, init) => { mutation = init; return new Response(JSON.stringify({ data: run }),
      { status: 200, headers: { etag: '"run-1:v1"' } }); }) as typeof fetch });
  const result = await createVerificationRun(http, "project-1", request, "operation-1");
  assert.equal(new Headers(mutation?.headers).get("Idempotency-Key"), "operation-1");
  assert.deepEqual(JSON.parse(String(mutation?.body)), request);
  assert.equal(result.data.configuration.fixVerificationScope, request.scopeToken);
  assert.equal(result.data.status, "active");
  assert.equal(result.etag, '"run-1:v1"');
});

test("response from another project cannot be opened as a verification run", async () => {
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "qa-token",
    fetch: (async () => new Response(JSON.stringify({ data: { ...run, projectId: "other-project" } }))) as typeof fetch });
  await assert.rejects(createVerificationRun(http, "project-1", request, "operation-1"), /does not match/);
});

test("generated run names fit the contract while preserving the complete build reference", () => {
  const build = "a".repeat(500);
  for (const ru of [true, false]) {
    const body = buildVerificationRunRequest(request.scopeToken, request.environmentId, build, ru);
    assert.equal(body.build, build);
    assert.equal(body.name.length, 240);
  }
  const body = buildVerificationRunRequest(request.scopeToken, request.environmentId, "🧪".repeat(200), false);
  assert.ok(body.name.length <= 240);
  assert.doesNotMatch(body.name, /[\uD800-\uDBFF]$/);
});

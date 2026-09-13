import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient, TmsApiError } from "../../../../../core/tms/transport/http";
import { createVerificationRunStarter } from "../application/verification-run-starter";
import { request, run } from "./fixtures/verification-fixture";

function client(fetcher: typeof fetch) {
  return createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "qa-token", fetch: fetcher });
}
test("unknown start outcome retries the identical body/key even after build and queue change", async () => {
  const bodies: string[] = []; const keys: string[] = [];
  const http = client((async (_url, init) => {
    bodies.push(String(init?.body)); keys.push(new Headers(init?.headers).get("Idempotency-Key") ?? "");
    if (bodies.length === 1) throw new TypeError("Network disconnected after commit");
    return new Response(JSON.stringify({ data: run }));
  }) as typeof fetch);
  const starter = createVerificationRunStarter(http, () => "stable-key");
  await assert.rejects(starter.start("project-1", request), /disconnected/);
  assert.deepEqual(starter.pending("project-1"), request);
  const result = await starter.start("project-1", { ...request, build: "build-99", scopeToken: "c".repeat(64) });
  assert.equal(result.data.id, "run-1");
  assert.equal(bodies[0], bodies[1]);
  assert.deepEqual(keys, ["stable-key", "stable-key"]);
  assert.equal(starter.pending("project-1"), null);
});

test("double submission shares a single request", async () => {
  let calls = 0; let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const starter = createVerificationRunStarter(client((async () => {
    calls += 1; await gate; return new Response(JSON.stringify({ data: run }));
  }) as typeof fetch));
  const first = starter.start("project-1", request);
  const second = starter.start("project-1", request);
  await Promise.resolve(); release?.();
  const results = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(results[0].data.id, results[1].data.id);
});

test("definitive scope conflicts allow a fresh operation after queue refresh", async () => {
  const keys: string[] = []; let serial = 0;
  const starter = createVerificationRunStarter(client((async (_url, init) => {
    keys.push(new Headers(init?.headers).get("Idempotency-Key") ?? "");
    if (keys.length === 1) return new Response(JSON.stringify({ error: { code: "CONFLICT", message: "scopeToken changed" } }), { status: 409 });
    return new Response(JSON.stringify({ data: run }));
  }) as typeof fetch), () => `key-${++serial}`);
  await assert.rejects(starter.start("project-1", request), (error: unknown) => error instanceof TmsApiError && error.status === 409);
  assert.equal(starter.pending("project-1"), null);
  await starter.start("project-1", { ...request, scopeToken: "b".repeat(64) });
  assert.deepEqual(keys, ["key-1", "key-2"]);
});

test("unresolved operations remain isolated when switching projects", async () => {
  const requests: { project: string; key: string; build: string }[] = []; let serial = 0;
  const starter = createVerificationRunStarter(client((async (url, init) => {
    const project = String(url).includes("project-2") ? "project-2" : "project-1";
    requests.push({ project, key: new Headers(init?.headers).get("Idempotency-Key") ?? "", build: JSON.parse(String(init?.body)).build });
    if (requests.length === 1) throw new TypeError("Network lost");
    return new Response(JSON.stringify({ data: { ...run, id: `run-${project}`, projectId: project } }));
  }) as typeof fetch), () => `key-${++serial}`);
  await assert.rejects(starter.start("project-1", request));
  await starter.start("project-2", { ...request, build: "second" });
  assert.deepEqual(starter.pending("project-1"), request);
  await starter.start("project-1", { ...request, build: "newer" });
  assert.deepEqual(requests, [
    { project: "project-1", key: "key-1", build: "build-42" },
    { project: "project-2", key: "key-2", build: "second" },
    { project: "project-1", key: "key-1", build: "build-42" },
  ]);
});


test("uncertain defect starts stay isolated from other defects and the whole project", async () => {
  const requests: { body: unknown; key: string }[] = []; let serial = 0;
  const starter = createVerificationRunStarter(client((async (_url, init) => {
    requests.push({ body: JSON.parse(String(init?.body)), key: new Headers(init?.headers).get("Idempotency-Key") ?? "" });
    if (requests.length === 1) throw new TypeError("Network lost after commit");
    return new Response(JSON.stringify({ data: run }));
  }) as typeof fetch), () => `key-${++serial}`);
  const defectA = { ...request, defectId: "bug-a" };
  await assert.rejects(starter.start("project-1", defectA));
  await starter.start("project-1", { ...request, defectId: "bug-b" });
  await starter.start("project-1", request);
  assert.deepEqual(starter.pending("project-1", "bug-a"), defectA);
  assert.equal(starter.pending("project-1", "bug-b"), null);
  assert.equal(starter.pending("project-1"), null);
  await starter.start("project-1", { ...defectA, build: "changed" });
  assert.deepEqual(requests.map((item) => item.key), ["key-1", "key-2", "key-3", "key-1"]);
  assert.deepEqual(requests[3].body, requests[0].body);
});

test("concurrent defects are independent while duplicate taps share their operation", async () => {
  const bodies: string[] = []; let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const starter = createVerificationRunStarter(client((async (_url, init) => {
    bodies.push(String(init?.body)); await gate; return new Response(JSON.stringify({ data: run }));
  }) as typeof fetch));
  const a = starter.start("project-1", { ...request, defectId: "a" });
  const duplicate = starter.start("project-1", { ...request, defectId: "a" });
  const b = starter.start("project-1", { ...request, defectId: "b" });
  release(); await Promise.all([a, duplicate, b]);
  assert.equal(bodies.length, 2);
  assert.deepEqual(bodies.map((body) => JSON.parse(body).defectId).sort(), ["a", "b"]);
});

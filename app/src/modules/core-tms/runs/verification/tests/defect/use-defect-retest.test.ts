import assert from "node:assert/strict";
import test from "node:test";
import { queue, run } from "../fixtures/verification-fixture";
import { gate, response, retestHarness, tick } from "./retest-harness";

test("retest fetches the selected defect scope, creates fresh work and never reuses its original item", async () => {
  const f = retestHarness(); const form = f.prepare();
  assert.equal(form.environmentId, "env-1");
  assert.deepEqual(form.environments.map(item => item.id), ["env-default", "env-1"]);
  await form.start();
  assert.equal(f.requests.length, 2);
  assert.equal(f.requests[0].url.pathname, "/api/v1/projects/project-1/verification-queue");
  assert.equal(f.requests[0].url.searchParams.get("defectId"), "bug-1");
  assert.equal(f.requests[0].url.searchParams.get("offset"), "0");
  assert.equal(f.requests[1].url.pathname, "/api/v1/projects/project-1/verification-runs");
  assert.equal(f.requests[1].method, "POST");
  assert.deepEqual(f.requests[1].body, { scopeToken: queue.data.scopeToken, defectId: "bug-1",
    environmentId: "env-1", build: "build-fixed-42", name: "Повторная проверка · BUG-1" });
  assert.ok(f.requests[1].key);
  assert.deepEqual(f.navigated, [[run.id, null]]);
  assert.deepEqual(f.etags, ['"run-new:v1"']);
  assert.equal(f.state.data.runs[0].id, run.id);
  assert.equal(f.state.data.runs[1].id, "origin-completed");
  assert.equal(f.state.data.runs[1].status, "completed");
  assert.equal(f.render().isOpen, false); f.h.dispose();
});

for (const change of ["defect", "project", "view", "status", "unmount"] as const) {
  test(`${change} change cancels an in-flight queue and cannot navigate or create from its stale response`, async () => {
    const read = gate<Response>(); const f = retestHarness(() => read.promise);
    const running = f.prepare().start(); await tick(); assert.equal(f.requests.length, 1);
    if (change === "defect") f.input.defect = { ...f.input.defect, id: "bug-2" };
    if (change === "project") f.derived.project.id = "project-2";
    if (change === "view") f.state.view = "cases";
    if (change === "status") f.input.defect = { ...f.input.defect, status: "verified" };
    if (change === "unmount") f.h.dispose(); else f.render();
    assert.equal(f.requests[0].signal?.aborted, true);
    read.resolve(response(queue)); await running;
    assert.equal(f.requests.length, 1);
    assert.deepEqual(f.navigated, []); assert.deepEqual(f.writes, []); assert.deepEqual(f.etags, []);
    f.h.dispose();
  });
}

test("a late create response for another selected defect never replaces workspace state or opens its run", async () => {
  const create = gate<Response>(); const f = retestHarness(request => request.method === "GET" ? response(queue) : create.promise);
  const running = f.prepare().start(); await tick(); assert.equal(f.requests.length, 2);
  f.input.defect = { ...f.input.defect, id: "bug-2", key: "BUG-2" }; f.render();
  create.resolve(response({ data: run })); await running;
  assert.equal(f.requests[1].signal?.aborted, true);
  assert.deepEqual(f.navigated, []); assert.deepEqual(f.writes, []); assert.deepEqual(f.etags, []);
  assert.equal(f.render().isOpen, false); f.h.dispose();
});

test("unknown create outcome retries the same operation and body without re-fetching changed scope", async () => {
  let creates = 0;
  const f = retestHarness(request => {
    if (request.method === "GET") return response(queue);
    if (++creates === 1) throw new TypeError("Connection lost after server commit");
    return response({ data: run });
  });
  await f.prepare().start();
  let form = f.render(); assert.equal(form.unresolved, true); assert.match(form.error, /второй прогон не создастся/);
  form.close(); f.render().open(); form = f.render();
  assert.equal(form.build, "build-fixed-42");
  form.setBuild("changed-build"); f.render().setEnvironmentId("env-default");
  await f.render().start();
  assert.equal(f.requests.filter(request => request.method === "GET").length, 1);
  const posts = f.requests.filter(request => request.method === "POST");
  assert.equal(posts.length, 2); assert.equal(posts[0].key, posts[1].key);
  assert.deepEqual(posts[0].body, posts[1].body);
  assert.deepEqual(f.navigated, [[run.id, null]]); assert.equal(f.render().unresolved, false); f.h.dispose();
});

test("an unresolved retest remains isolated when switching defects and is recoverable on return", async () => {
  let failed = false;
  const f = retestHarness(request => {
    if (request.method === "GET") return response(queue);
    if (request.body?.defectId === "bug-1" && !failed) { failed = true; throw new TypeError("Unknown outcome"); }
    return response({ data: { ...run, id: `run-${request.body?.defectId}` } });
  });
  await f.prepare("build-first").start(); assert.equal(f.render().unresolved, true);
  f.input.defect = { ...f.input.defect, id: "bug-2", key: "BUG-2" };
  assert.equal(f.render().isOpen, false); assert.equal(f.render().unresolved, false);
  f.render().open(); assert.equal(f.render().build, "");
  f.render().setBuild("build-second"); await f.render().start();
  f.input.defect = { ...f.input.defect, id: "bug-1", key: "BUG-1" };
  f.render().open(); assert.equal(f.render().build, "build-first");
  assert.equal(f.render().unresolved, true); await f.render().start();
  const posts = f.requests.filter(request => request.method === "POST");
  assert.equal(posts.length, 3); assert.equal(posts[0].key, posts[2].key);
  assert.notEqual(posts[0].key, posts[1].key); assert.deepEqual(posts[0].body, posts[2].body);
  assert.deepEqual(f.navigated, [["run-bug-2", null], ["run-bug-1", null]]);
  f.h.dispose();
});

test("zero linked eligible cases produces an actionable error and never creates a run", async () => {
  const f = retestHarness(() => response({ ...queue, data: { ...queue.data, totalCases: 0, blockedEntries: 1 } }));
  await f.prepare().start();
  assert.equal(f.requests.length, 1); assert.match(f.render().error, /нет связанного тест-кейса/);
  assert.equal(f.render().pending, false); assert.equal(f.render().isOpen, true);
  assert.deepEqual(f.navigated, []); assert.deepEqual(f.writes, []); f.h.dispose();
});

test("double submit shares one queue read and one fresh run", async () => {
  const read = gate<Response>(); const f = retestHarness(request => request.method === "GET" ? read.promise : response({ data: run }));
  const form = f.prepare(); const first = form.start(); const duplicate = form.start();
  await tick(); assert.equal(f.requests.length, 1);
  read.resolve(response(queue)); await Promise.all([first, duplicate]);
  assert.equal(f.requests.length, 2); assert.deepEqual(f.navigated, [[run.id, null]]); f.h.dispose();
});

test("permission and input validation block any retest mutation", async () => {
  const f = retestHarness(); f.state.data.meta.authorization.capabilities = ["defect:read"];
  await f.prepare().start(); assert.equal(f.render().enabled, true); assert.equal(f.render().canStart, false);
  assert.deepEqual(f.requests, []); f.h.dispose();
  const valid = retestHarness(); await valid.prepare(" ").start(); assert.deepEqual(valid.requests, []);
  assert.match(valid.render().error, /Укажите сборку/);
  valid.render().setBuild("build"); valid.render().setEnvironmentId("env-archived");
  await valid.render().start(); assert.deepEqual(valid.requests, []); assert.match(valid.render().error, /Выберите окружение/);
  valid.h.dispose();
});


test("unavailable cases and deleted steps explain why retest cannot start without mutating history", async () => {
  for (const [reason, message] of [["case_unavailable", /архивирован/], ["step_missing", /шаг удалён/]] as const) {
    const f = retestHarness(() => response({ ...queue, data: { ...queue.data, totalCases: 0,
      entries: queue.data.entries.map((entry) => ({ ...entry, blockedReason: reason })) } }));
    await f.prepare().start(); assert.match(f.render().error, message);
    assert.equal(f.requests.length, 1); assert.deepEqual(f.writes, []); assert.deepEqual(f.navigated, []);
    f.h.dispose();
  }
});

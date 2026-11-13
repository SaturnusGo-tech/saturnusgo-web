import assert from "node:assert/strict";
import test from "node:test";
import { mapRun } from "../../../../runs/data/run-mapper";
import { defect, item, run } from "../fixtures/execution-fixture";
import { contextHarness } from "../support/context-harness";

test("loads only the original archived run and exact immutable item for a verified defect", async () => {
  const f = await contextHarness();
  try {
    assert.deepEqual(f.requests.map(request => request.path), ["/api/v1/runs/run-1", "/api/v1/runs/run-1/items/item-1"]);
    assert.equal(f.current.run?.build, "original-build");
    assert.equal(f.current.run?.environment.name, "Original QA");
    assert.equal(f.current.item?.snapshot.title, "Immutable checkout title");
    assert.equal(f.current.item?.revision, 2);
    assert.equal(f.current.pending, false); assert.equal(f.current.error, false);
  } finally { await f.dispose(); }
});

test("reuses a run only when both its ID and project match the defect", async () => {
  const exact = await contextHarness(undefined, { run: mapRun(run) });
  try { assert.deepEqual(exact.requests.map(request => request.path), ["/api/v1/runs/run-1/items/item-1"]); }
  finally { await exact.dispose(); }
  for (const other of [{ ...run, id: "retest-1", build: "fixed-build" }, { ...run, projectId: "other-project" }]) {
    const f = await contextHarness(undefined, { run: mapRun(other) });
    try { assert.equal(f.requests[0]?.path, "/api/v1/runs/run-1"); assert.equal(f.current.run?.build, "original-build"); }
    finally { await f.dispose(); }
  }
});

test("runless defects and disconnected or incomplete scopes perform no reads", async () => {
  for (const change of [{ connected: false }, { workspaceId: "" }, { defect: { ...defect, id: "" } },
    { defect: { ...defect, projectId: "" } }, { defect: { ...defect, runId: null, runItemId: null } }]) {
    const f = await contextHarness(undefined, change);
    try { assert.equal(f.requests.length, 0); assert.equal(f.current.item, undefined); assert.equal(f.current.pending, false); }
    finally { await f.dispose(); }
  }
});

test("a source run without an item stays readable without inventing a snapshot", async () => {
  const f = await contextHarness(undefined, { defect: { ...defect, runItemId: null, stepId: null } });
  try {
    assert.deepEqual(f.requests.map(request => request.path), ["/api/v1/runs/run-1"]);
    assert.equal(f.current.run?.id, "run-1"); assert.equal(f.current.item, undefined);
    assert.equal(f.current.pending, false); assert.equal(f.current.error, false);
  } finally { await f.dispose(); }
});

for (const status of [403, 404]) {
  test(`${status} original run is unavailable without requesting any run items`, async () => {
    const f = await contextHarness(() => Response.json({ error: {
      code: "RESOURCE_UNAVAILABLE", message: "Unavailable",
    } }, { status }));
    try {
      assert.deepEqual(f.requests.map(request => request.path), ["/api/v1/runs/run-1"]);
      assert.equal(f.current.run, undefined); assert.equal(f.current.item, undefined);
      assert.equal(f.current.pending, false); assert.equal(f.current.error, true);
    } finally { await f.dispose(); }
  });
  test(`${status} historical item keeps its verified source run and reports unavailable data`, async () => {
    const f = await contextHarness(request => request.path.endsWith("/item-1")
      ? Response.json({ error: { code: "RESOURCE_UNAVAILABLE", message: "Unavailable" } }, { status })
      : Response.json({ data: run }));
    try {
      assert.equal(f.current.run?.id, "run-1"); assert.equal(f.current.item, undefined);
      assert.equal(f.current.pending, false); assert.equal(f.current.error, true);
    } finally { await f.dispose(); }
  });
}

test("rejects mismatched source run, project, item and direct case identities", async () => {
  for (const [wrongRun, wrongItem] of [
    [{ ...run, id: "other-run" }, item], [{ ...run, projectId: "other-project" }, item],
    [run, { ...item, id: "other-item" }], [run, { ...item, caseId: "other-case" }],
  ] as const) {
    const f = await contextHarness(request => Response.json({ data: request.path.endsWith("/item-1") ? wrongItem : wrongRun }),
      { defect: { ...defect, sourceCaseId: "case-1" } });
    try {
      assert.equal(f.current.item, undefined); assert.equal(f.current.error, true); assert.equal(f.current.pending, false);
      if (wrongRun.id !== run.id || wrongRun.projectId !== run.projectId) {
        assert.equal(f.current.run, undefined); assert.equal(f.requests.length, 1);
      }
    } finally { await f.dispose(); }
  }
});

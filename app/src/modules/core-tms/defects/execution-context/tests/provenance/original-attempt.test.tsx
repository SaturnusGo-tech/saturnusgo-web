import assert from "node:assert/strict";
import test from "node:test";
import { contextHarness } from "../support/context-harness";
import { defect, item, run } from "../fixtures/execution-fixture";

test("reads the defect occurrence attempt instead of the active retest", async () => {
  const original = { ...item.activeAttempt, attemptNo: 1, status: "failed" as const, actualResult: "Original failure" };
  const f = await contextHarness(request => Response.json({ data: request.path.endsWith("/attempts/1")
    ? original : request.path.endsWith("/item-1") ? { ...item, activeAttempt: { ...item.activeAttempt, status: "passed" } } : run }),
  { defect: { ...defect, attemptNo: 1 } });
  try {
    assert.equal(f.current.attempt?.attemptNo, 1);
    assert.equal(f.current.attempt?.actualResult, "Original failure");
    assert.equal(f.current.attempt?.status, "failed");
    assert.equal(f.requests[f.requests.length - 1]?.path, "/api/v1/runs/run-1/items/item-1/attempts/1");
  } finally { await f.dispose(); }
});

test("never substitutes the latest retest when the original attempt is unavailable", async () => {
  const f = await contextHarness(request => request.path.includes("/attempts/")
    ? Response.json({ error: { code: "RESOURCE_UNAVAILABLE", message: "Unavailable" } }, { status: 404 })
    : Response.json({ data: request.path.endsWith("/item-1") ? item : run }),
  { defect: { ...defect, attemptNo: 1 } });
  try { assert.equal(f.current.attempt, undefined); assert.equal(f.current.error, true); }
  finally { await f.dispose(); }
});

test("reuses the active attempt only when it is exactly the recorded occurrence", async () => {
  const f = await contextHarness(undefined, { defect: { ...defect, attemptNo: 2 } });
  try {
    assert.equal(f.current.attempt?.attemptNo, 2);
    assert.equal(f.requests.length, 2);
  } finally { await f.dispose(); }
});

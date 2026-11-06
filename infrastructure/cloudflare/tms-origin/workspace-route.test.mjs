import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "./worker.mjs";
const origin = "https://tms.saturnusgo.com", legacy = "/testcases/umbrella-home/work/";
test("legacy workspace documents redirect to the neutral path with query and fragment intact", async () => {
  for (const method of ["GET", "HEAD"]) for (const path of [legacy, legacy.slice(0, -1), "/work"]) {
    const response = await worker.fetch(new Request(origin + path + "?workspaceId=space&caseId=case#step", { method }), {});
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), origin + "/work/?workspaceId=space&caseId=case#step");
  }
});
test("workspace aliases do not redirect API requests, mutations or child paths", async () => {
  for (const [path, method] of [[legacy, "POST"], [legacy + "child", "GET"], ["/work/child", "GET"], ["/api/v1/work/", "GET"]]) {
    const response = await worker.fetch(new Request(origin + path, { method }), {});
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.equal(response.headers.get("location"), null);
  }
});

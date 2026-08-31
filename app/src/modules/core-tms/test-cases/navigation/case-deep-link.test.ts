import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCaseDeepLink,
  clearCaseDeepLink,
  readCaseDeepLink,
} from "./case-deep-link";

test("builds a canonical stable case link and removes release cache busters", () => {
  const link = buildCaseDeepLink(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?release=abc&__designPreview=1#old",
    { projectId: "project host/1", caseId: "case:240" },
  );
  const url = new URL(link);
  assert.equal(url.hash, "");
  assert.equal(url.searchParams.get("release"), null);
  assert.equal(url.searchParams.get("__designPreview"), null);
  assert.equal(url.searchParams.get("projectId"), "project host/1");
  assert.equal(url.searchParams.get("caseId"), "case:240");
});

test("reads and clears the selected case without changing the route", () => {
  const href = "https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=p1&caseId=c1";
  assert.deepEqual(readCaseDeepLink(href), { projectId: "p1", caseId: "c1" });
  assert.equal(clearCaseDeepLink(href), "https://tms.saturnusgo.com/testcases/umbrella-home/work/");
});

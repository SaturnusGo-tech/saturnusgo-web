import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCaseDeepLink,
  clearCaseDeepLink,
  readCaseDeepLink,
} from "./case-deep-link";

test("builds a canonical stable case link and removes release cache busters", () => {
  const link = buildCaseDeepLink(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?release=abc&defectId=d1&view=reports#old",
    { projectId: "project host/1", caseId: "case:240" },
  );
  const url = new URL(link);
  assert.equal(url.hash, "");
  assert.equal(url.searchParams.get("release"), null);
  assert.equal(url.searchParams.get("defectId"), null);
  assert.equal(url.searchParams.get("view"), null);
  assert.equal(url.searchParams.get("projectId"), "project host/1");
  assert.equal(url.searchParams.get("caseId"), "case:240");
});

test("does not erase a defect deep link while the workspace bootstraps", () => {
  const link = buildCaseDeepLink(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=p1&defectId=d1",
    { projectId: "p1", caseId: "c1" },
    { preserveDefectSelection: true },
  );
  const url = new URL(link);
  assert.equal(url.searchParams.get("defectId"), "d1");
  assert.equal(url.searchParams.get("caseId"), "c1");
  const legacy = new URL(buildCaseDeepLink(
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?view=reports&defect=legacy-1",
    { projectId: "p1", caseId: "c1" }, { preserveDefectSelection: true },
  ));
  assert.equal(legacy.searchParams.get("defect"), "legacy-1");
  assert.equal(legacy.searchParams.get("view"), "reports");
});

test("reads and clears the selected case without changing the route", () => {
  const href = "https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=p1&caseId=c1";
  assert.deepEqual(readCaseDeepLink(href), { projectId: "p1", caseId: "c1" });
  assert.equal(clearCaseDeepLink(href), "https://tms.saturnusgo.com/testcases/umbrella-home/work/");
});

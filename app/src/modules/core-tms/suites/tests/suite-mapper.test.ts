import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { mapSuite, mapSuiteSummary } from "../data/suite-mapper";

type Api = components["schemas"];
const time = "2026-08-28T00:00:00Z";

test("keeps suite lists bounded and hydrates membership only from detail", () => {
  const summary: Api["SuiteSummary"] = {
    id: "suite-1", projectId: "project-1", key: "UH-TS-1", name: "Smoke",
    description: "Release checks", type: "static", caseCount: 250, status: "active",
    createdAt: time, updatedAt: time,
  };
  const listed = mapSuiteSummary(summary);
  assert.equal(listed.caseCount, 250);
  assert.equal("caseIds" in listed, false);

  const detail = mapSuite({
    ...summary, caseIds: ["case-1"], filter: {}, resolvedCaseCount: 1,
  });
  assert.deepEqual(detail.caseIds, ["case-1"]);
  assert.equal(detail.resolvedCaseCount, 1);
});

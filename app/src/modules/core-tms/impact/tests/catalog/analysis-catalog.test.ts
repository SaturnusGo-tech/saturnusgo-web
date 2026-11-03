import assert from "node:assert/strict";
import { test } from "node:test";
import { analysis } from "../fixtures/impact-fixture";
import { analysisCatalog, analysisMatches, analysisNeedsAttention, openCoverageGapCount } from "../../model/catalog/analysis-catalog";

test("review and attention queues preserve distinct review and provider states", () => {
  const ready = analysis();
  assert.equal(analysisMatches(ready, "review"), true);
  assert.equal(analysisMatches({ ...ready, approved: true }, "review"), false);
  assert.equal(analysisMatches({ ...ready, approved: true }, "approved"), true);
  assert.equal(analysisMatches({ ...ready, status: "processing" }, "active"), true);
  assert.equal(analysisMatches({ ...ready, status: "pending" }, "review"), false);
  assert.equal(analysisNeedsAttention({ ...ready, errorCode: "AI_REQUEST_BUDGET_EXCEEDED" }), true);
  assert.equal(analysisNeedsAttention({ ...ready, buildStatus: "failed" }), true);
  assert.equal(analysisNeedsAttention({ ...ready, aiEnabled: false }), false);
});

test("large lists search PR, author and branch without retaining an empty later page", () => {
  const rows = Array.from({ length: 127 }, (_, i) => analysis({ id: `analysis_${i}` }));
  rows[126] = { ...rows[126], change: { ...rows[126].change, prNumber: 726, author: "Sofia García", branch: "fix/booking-timezone" } };
  assert.equal(analysisCatalog(rows, "", "all", 13).items.length, 7);
  for (const query of ["#726", "sofIA", "booking-timezone"]) {
    const page = analysisCatalog(rows, query, "all", 13);
    assert.equal(page.page, 1);
    assert.deepEqual(page.items.map(row => row.id), ["analysis_126"]);
  }
  assert.equal(analysisCatalog(rows, "no such analysis", "all", 13).total, 0);
});

test("coverage counts only unresolved gaps, including failed draft generation", () => {
  const item = analysis();
  item.result = { summary: "Booking", riskLevel: "medium", impactedAreas: [], selectedTestCases: [], notes: [],
    ai: { status: "disabled", provider: "", model: "", promptVersion: "1", schemaVersion: "1", inputTokens: 0, outputTokens: 0, cost: null, latencyMs: 0, candidateCount: 0 },
    coverageGaps: ["open", "generated", "acknowledged", "failed"].map(id => ({ id, area: id, platform: "web", reason: "Check", changedFiles: [], suggestedTestCases: [] })) };
  item.gapActions = ["generated", "acknowledged", "failed"].map(status => ({ gapId: status, status: status as "generated" | "acknowledged" | "failed", reason: "", testCaseId: null, errorCode: null }));
  assert.equal(openCoverageGapCount(item), 2);
});

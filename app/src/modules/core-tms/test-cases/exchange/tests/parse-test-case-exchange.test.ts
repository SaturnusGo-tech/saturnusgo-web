import assert from "node:assert/strict";
import test from "node:test";
import { TEST_CASE_EXCHANGE_SCHEMA } from "../model/test-case-exchange";
import { parseTestCaseExchange } from "../validation/parse-test-case-exchange";

function source(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    schemaVersion: TEST_CASE_EXCHANGE_SCHEMA,
    exportedAt: "2026-08-29T00:00:00.000Z",
    project: { key: "HOST", name: "Umbrella-Host" },
    testCases: [{
      sourceKey: "HOST-ENTRY-001",
      folderPath: "/Host/Entry",
      title: "Host enters the product",
      description: "",
      preconditions: "Signed out",
      type: "manual",
      lifecycle: "ready",
      priority: "critical",
      component: "Host Entry",
      tags: ["host", "ui"],
      estimatedMinutes: 4,
      testData: "",
      steps: [{ order: 1, action: "Open app", expectedResult: "Login is visible", testData: "", required: true }],
      checklist: [],
    }],
    ...overrides,
  });
}

test("parses one portable test case without reinterpreting product content", () => {
  const parsed = parseTestCaseExchange(source());
  assert.equal(parsed.project.name, "Umbrella-Host");
  assert.equal(parsed.testCases[0]?.sourceKey, "HOST-ENTRY-001");
  assert.deepEqual(parsed.testCases[0]?.tags, ["host", "ui"]);
  assert.equal(parsed.testCases[0]?.steps[0]?.expectedResult, "Login is visible");
});

test("rejects duplicate source keys", () => {
  const base = JSON.parse(source()) as { testCases: unknown[] };
  assert.throws(
    () => parseTestCaseExchange(JSON.stringify({ ...base, testCases: [base.testCases[0], base.testCases[0]] })),
    /sourceKey values must be unique/,
  );
});

test("rejects incompatible manual checklist content", () => {
  const base = JSON.parse(source()) as { testCases: Record<string, unknown>[] };
  base.testCases[0] = { ...base.testCases[0], checklist: [{ text: "Unexpected" }] };
  assert.throws(() => parseTestCaseExchange(JSON.stringify(base)), /invalid procedure/);
});

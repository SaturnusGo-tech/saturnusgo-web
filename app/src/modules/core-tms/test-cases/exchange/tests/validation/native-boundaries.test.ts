import test from "node:test";
import assert from "node:assert/strict";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";

const base = { schemaVersion: "saturnusgo.tms.test-cases.v2", exportedAt: "2026-11-12T00:00:00Z",
  project: { key: "SOURCE", name: "Source" }, testCases: [{ title: "Import", steps: [] }] };
const parse = (value: object) => parseTestCaseExchange(JSON.stringify({ ...base, testCases: [value] }));
test("explicit native null semantics and invalid orders reject before any write", () => {
  for (const property of ["type", "lifecycle", "folderPath"]) {
    assert.throws(() => parse({ title: "Case", [property]: null }), property);
  }
  const step = { action: "Act", expectedResult: "Expected" };
  for (const orders of [[1, 1], [1, 3], [0, 1], [1, null]]) {
    assert.throws(() => parse({ title: "Case", steps: orders.map(order => ({ ...step, order })) }), String(orders));
    assert.throws(() => parse({ title: "Checklist", type: "checklist", checklist: orders.map(order => ({ text: "Check", order })) }), String(orders));
  }
  assert.equal(parse({ title: "Case", priority: null }).testCases[0]?.priority, null);
  assert.deepEqual(parse({ title: "Case", steps: [2, 1].map(order => ({ ...step, order })) }).testCases[0]?.steps.map(s => s.order), [2, 1]);
});

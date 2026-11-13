import assert from "node:assert/strict";
import test from "node:test";
import { insertSharedStepAfter } from "../insert-shared-step";
import type { SharedStepSnapshot, TestStep } from "../../../../../../../../core/tms/contracts/legacy-contract";

const procedure: SharedStepSnapshot = { id: "login", title: "Sign in", revision: 2,
  items: [{ id: "enter", order: 1, action: "Sign in", expectedResult: "Home opens", testData: "", required: true, attachmentIds: [] }] };
const blank: TestStep = { id: "initial", order: 1, action: "", expectedResult: "", testData: "", required: true, attachmentIds: [] };

test("a shared procedure can be first without retaining the untouched initial placeholder", () => {
  const result = insertSharedStepAfter([blank], -1, procedure);
  assert.equal(result.length, 1);
  assert.equal(result[0].order, 1);
  assert.equal(result[0].sharedStepId, "login");
  assert.equal(result[0].sharedStep?.revision, 2);
});
test("inserting before the first step preserves authored text, test data and evidence", () => {
  for (const edit of [{ action: "Checkout" }, { expectedResult: "Paid" }, { testData: "user=qa" }, { attachmentIds: ["photo"] }]) {
    const authored = { ...blank, ...edit };
    const result = insertSharedStepAfter([authored], -1, procedure);
    assert.equal(result.length, 2);
    assert.equal(result[0].sharedStepId, "login");
    assert.deepEqual(result[1], { ...authored, order: 2 });
  }
});
test("inserting at the end never removes a placeholder in another position", () => {
  const result = insertSharedStepAfter([blank], 0, procedure);
  assert.deepEqual(result.map(step => step.id === "initial" ? step.id : step.sharedStepId), ["initial", "login"]);
  assert.deepEqual(result.map(step => step.order), [1, 2]);
});

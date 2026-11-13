import test from "node:test";
import assert from "node:assert/strict";
import { validateDefectDraft } from "../validation/validateDefectDraft";
import type { DefectDraft } from "../model";
const draft: DefectDraft = { title: "Empty order screen", description: "", preconditions: "", testData: "", actualResult: "## Actual\n\nThe screen stays empty.",
  expectedResult: "Order details", component: "Orders", severity: "high", priority: "medium",
  reproducibility: "Sometimes", assigneeIdentityId: null, link: "" };

test("a standalone bug accepts Markdown without requiring an unrelated run description", () => {
  assert.deepEqual(validateDefectDraft(draft, true), {});
  assert.deepEqual(Object.keys(validateDefectDraft({ ...draft, title: " ", actualResult: "\n" }, true)), ["title", "actualResult"]);
});
test("selected shared revisions do not require duplicated narrative instructions", () => {
  assert.deepEqual(validateDefectDraft({ ...draft, reproductionSharedSteps: [{ sharedStepId: "shared-1", revision: 3 }] }, false), {});
});

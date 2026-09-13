import test from "node:test";
import assert from "node:assert/strict";
import { validateDefectDraft } from "../validation/validateDefectDraft";
import type { DefectDraft } from "../model";
const draft: DefectDraft = { title: "Empty order screen", description: "", actualResult: "## Actual\n\nThe screen stays empty.",
  expectedResult: "Order details", component: "Orders", severity: "high", priority: "medium",
  reproducibility: "Sometimes", assigneeIdentityId: null, link: "" };

test("a standalone bug accepts Markdown without requiring an unrelated run description", () => {
  assert.deepEqual(validateDefectDraft(draft, true), {});
  assert.deepEqual(Object.keys(validateDefectDraft({ ...draft, title: " ", actualResult: "\n" }, true)), ["title", "actualResult"]);
});
test("a step-linked bug requires description and reproduction and reports the exact fields", () => {
  const linked = { ...draft, reproduction: " " };
  assert.deepEqual(Object.keys(validateDefectDraft(linked, false)), ["description", "reproduction"]);
  assert.deepEqual(validateDefectDraft({ ...linked, description: "After login", reproduction: "1. Log in\n2. Open orders" }, false), {});
});

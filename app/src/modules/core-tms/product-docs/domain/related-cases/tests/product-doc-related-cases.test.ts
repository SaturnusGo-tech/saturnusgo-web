import assert from "node:assert/strict";
import test from "node:test";
import { relatedCasesChanged, toggleRelatedCases, uniqueRelatedCases } from "../product-doc-related-cases";

const first = { caseId: "a", title: "Sign in", sectionId: "authentication" };
const second = { caseId: "b", title: "Book a ride", sectionId: null };

test("bulk selection deduplicates existing case links and retains their section association", () => {
  assert.deepEqual(uniqueRelatedCases([first, { ...first, sectionId: null }, second]), [first, second]);
  assert.deepEqual(toggleRelatedCases([first], [first, second, second]), [first, second]);
});

test("toggling a whole visible folder removes only those links and retains unseen cases", () => {
  const unseen = { caseId: "c", title: "Unloaded case", sectionId: null };
  assert.deepEqual(toggleRelatedCases([first, second, unseen], [first, second]), [unseen]);
  assert.equal(relatedCasesChanged({ baseline: [first, second], cases: [second, first] }), false);
  assert.equal(relatedCasesChanged({ baseline: [first, second], cases: [first] }), true);
});

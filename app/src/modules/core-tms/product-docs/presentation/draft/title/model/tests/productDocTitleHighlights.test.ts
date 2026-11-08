import assert from "node:assert/strict";
import test from "node:test";
import { changeTitleHighlights, markTitleRange, trimTitleHighlights } from "../productDocTitleHighlights";

test("a selected range can change color and clear part of a marker", () => {
  const title = "Booking rules";
  const first = markTitleRange(title, [], 0, 7, "yellow");
  assert.deepEqual(markTitleRange(title, first, 4, 10, "blue"), [
    { start: 0, end: 4, color: "yellow" }, { start: 4, end: 10, color: "blue" },
  ]);
  assert.deepEqual(markTitleRange(title, first, 2, 5, null), [
    { start: 0, end: 2, color: "yellow" }, { start: 5, end: 7, color: "yellow" },
  ]);
});

test("title edits rebase ranges and retain a marker for an edit within its text", () => {
  const marks = [{ start: 2, end: 9, color: "green" }] as const;
  assert.deepEqual(changeTitleHighlights("A booking", "New booking", marks), [
    { start: 4, end: 11, color: "green" },
  ]);
  assert.deepEqual(changeTitleHighlights("A booking", "A bookXing", marks), [
    { start: 2, end: 10, color: "green" },
  ]);
  assert.deepEqual(trimTitleHighlights("  Booking  ", [{ start: 0, end: 11, color: "pink" }]), [
    { start: 0, end: 7, color: "pink" },
  ]);
});

test("UTF-16 ranges keep both halves of a supplementary character together", () => {
  assert.deepEqual(markTitleRange("A 🟢 plan", [], 3, 4, "blue"), [{ start: 2, end: 4, color: "blue" }]);
  assert.deepEqual(changeTitleHighlights("A 🟢 plan", "A 🔴 plan", [{ start: 2, end: 4, color: "blue" }]),
    [{ start: 2, end: 4, color: "blue" }]);
});

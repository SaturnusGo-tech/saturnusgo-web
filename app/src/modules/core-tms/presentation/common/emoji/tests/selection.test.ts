import { test } from "node:test";
import assert from "node:assert/strict";
import { insertEmojiSelection } from "../selection/insertEmojiSelection";

test("emoji replaces only the captured range and advances by UTF-16 caret units", () => {
  assert.deepEqual(insertEmojiSelection("**Hello** world", { value: "**Hello** world", start: 10, end: 15 }, "👩🏽‍💻"),
    { value: "**Hello** 👩🏽‍💻", caret: 17 });
});
test("changed content invalidates an old picker selection", () => {
  assert.equal(insertEmojiSelection("new case", { value: "old case", start: 0, end: 3 }, "✅"), null);
});
test("out of bounds selection and empty emoji do not mutate content", () => {
  assert.equal(insertEmojiSelection("abc", { value: "abc", start: 2, end: 9 }, "✅"), null);
  assert.equal(insertEmojiSelection("abc", { value: "abc", start: 0, end: 0 }, ""), null);
});

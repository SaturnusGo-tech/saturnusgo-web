import test from "node:test";
import assert from "node:assert/strict";
import { findVariableCompletion, insertVariableCompletion } from "../variable-completion";

test("completion follows the active two-segment token and ignores escaped literals", () => {
  assert.deepEqual(findVariableCompletion("Enter {{admin.pa", 16), {
    start: 6, end: 16, query: "admin.pa",
  });
  assert.equal(findVariableCompletion("Enter \\{{admin.pa", 17), null);
  assert.equal(findVariableCompletion("Enter {{admin.password}}", 24), null);
  assert.equal(findVariableCompletion("Enter ordinary text", 8), null);
});

test("completion is local to the caret, does not consume a later paragraph or expression", () => {
  const text = "First {{old.value}}\nEnter {{customer.em afterwards";
  const caret = text.indexOf(" afterwards");
  assert.deepEqual(findVariableCompletion(text, caret), {
    start: text.indexOf("{{customer"), end: caret, query: "customer.em",
  });
  assert.equal(findVariableCompletion("{{admin.password.toString", 25), null);
  assert.equal(findVariableCompletion("{{admin + other", 15), null);
  assert.equal(findVariableCompletion("{{admin.\npassword", 17), null);
});

test("insertion preserves surrounding content and places the caret after the completed token", () => {
  const text = "Enter {{admin.pa and submit";
  const result = insertVariableCompletion(text, { start: 6, end: 16, query: "admin.pa" }, "admin.password");
  assert.deepEqual(result, { value: "Enter {{admin.password}} and submit", caret: 24 });
});

test("insertion replaces existing closing braces without duplicating them", () => {
  const text = "Enter {{admin.pa}} now";
  const result = insertVariableCompletion(text, { start: 6, end: 16, query: "admin.pa" }, "admin.password");
  assert.deepEqual(result, { value: "Enter {{admin.password}} now", caret: 24 });
});

import assert from "node:assert/strict";
import test from "node:test";
import { nextMetadataOption } from "../navigation/nextMetadataOption";

test("metadata listbox wraps arrow navigation and supports boundaries", () => {
  assert.equal(nextMetadataOption(4, 3, "ArrowDown"), 0);
  assert.equal(nextMetadataOption(4, 0, "ArrowUp"), 3);
  assert.equal(nextMetadataOption(4, 2, "Home"), 0);
  assert.equal(nextMetadataOption(4, 1, "End"), 3);
  assert.equal(nextMetadataOption(0, 0, "ArrowDown"), -1);
});

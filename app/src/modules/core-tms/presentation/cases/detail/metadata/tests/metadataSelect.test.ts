import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { nextMetadataOption } from "../navigation/nextMetadataOption";

const source = readFileSync(new URL("../MetadataSelect.tsx", import.meta.url), "utf8");

test("metadata listbox wraps arrow navigation and supports boundaries", () => {
  assert.equal(nextMetadataOption(4, 3, "ArrowDown"), 0);
  assert.equal(nextMetadataOption(4, 0, "ArrowUp"), 3);
  assert.equal(nextMetadataOption(4, 2, "Home"), 0);
  assert.equal(nextMetadataOption(4, 1, "End"), 3);
  assert.equal(nextMetadataOption(0, 0, "ArrowDown"), -1);
});

test("metadata trigger is one colored control with its chevron inside", () => {
  assert.match(source, /className=\{`\$\{styles\.trigger\} \$\{selected\?\.tone/);
  assert.match(source, /className=\{styles\.triggerLabel\}/);
  assert.doesNotMatch(source, /className=\{`\$\{styles\.chip\} \$\{selected/);
  assert.match(source, /<ChevronDown[^>]+aria-hidden="true"/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../MetadataSelect.tsx", import.meta.url), "utf8");

test("metadata choices use a single HeroUI trigger with managed focus and selection", () => {
  assert.match(source, /<Dropdown placement="bottom-start" isOpen=\{open\} onOpenChange=\{setOpen\}/);
  assert.match(source, /<DropdownTrigger>\s*<Button/);
  assert.match(source, /<ChevronDown[^>]+aria-hidden="true"/);
  assert.match(source, /selectionMode="single" disallowEmptySelection selectedKeys=\{\[value\]\}/);
  assert.doesNotMatch(source, /showPopover|onKeyDown=/);
});

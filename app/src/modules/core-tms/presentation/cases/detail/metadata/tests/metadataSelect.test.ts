import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../../../../common/properties/select/PropertySelect.tsx", import.meta.url), "utf8");
const metadata = readFileSync(new URL("../CaseMetadataControls.tsx", import.meta.url), "utf8");

test("test case metadata uses the shared searchable HeroUI property picker and restores focus on Escape", () => {
  assert.match(metadata, /<PropertySelect/);
  assert.match(metadata, /<PriorityField/);
  assert.match(source, /<PopoverTrigger><Button ref=\{button\}/);
  assert.match(source, /<Input autoFocus/);
  assert.match(source, /selectionMode="single" hideSelectedIcon disallowEmptySelection selectedKeys=\{\[value\]\}/);
  assert.match(source, /event\.key === "Escape"[\s\S]*event\.stopPropagation\(\)[\s\S]*button\.current\?\.focus/);
  assert.doesNotMatch(metadata, /<MetadataSelect/);
});

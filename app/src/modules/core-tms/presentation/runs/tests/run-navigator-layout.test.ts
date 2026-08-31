import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const view = readFileSync(fileURLToPath(new URL("../navigator/RunNavigator.tsx", import.meta.url)), "utf8");
const styles = readFileSync(fileURLToPath(new URL("../navigator/run-navigator.module.css", import.meta.url)), "utf8");

test("run picker keeps complete names readable", () => {
  assert.match(view, /className=\{styles\.pickerTriggerText\}/);
  assert.match(view, /title=\{selectedRun\?\.name \?\? emptyLabel\}/);
  assert.match(view, /<small>\{selectedRun\.key\}<\/small>/);
  assert.match(styles, /\.pickerTriggerText strong\s*\{[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/s);
  assert.match(styles, /\.pickerOptionActive strong\s*\{[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/s);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dialog = readFileSync(new URL("../../dialogs/suite/SuiteDialog.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../dialogs/suite/suite-dialog.module.css", import.meta.url), "utf8");
const suites = readFileSync(new URL("../../suites/suites.module.css", import.meta.url), "utf8");

test("suite configuration follows the editable test-case document hierarchy", () => {
  assert.match(dialog, /type EditableSection = "name" \| "description" \| "mode" \| null/);
  assert.match(dialog, /className=\{dialog\.hero\}/);
  assert.match(dialog, /<EditButton section="name"/);
  assert.match(dialog, /<EditButton section="description"/);
  assert.match(dialog, /<EditButton section="mode"/);
  assert.match(dialog, /<EmbeddedCaseList/);
  assert.match(styles, /\.titleLine h1\s*\{[^}]*font-size: clamp\(25px, 3vw, 34px\)/s);
  assert.match(styles, /\.editorialSection\s*\{[^}]*border-bottom:/s);
});

test("suite primary actions keep white labels and neutral focus treatment", () => {
  assert.match(suites, /\.createButton\.createButton[\s\S]*color: #fff !important/);
  assert.match(suites, /\.workspace :is\(button, input\):focus-visible\s*\{[^}]*outline: 0 !important/s);
  assert.doesNotMatch(styles, /focus[^}]*border-color: var\(--action\)/s);
});

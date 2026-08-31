import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../markdown/MarkdownField.tsx", import.meta.url), "utf8");
const content = readFileSync(new URL("../CaseInspectorContent.tsx", import.meta.url), "utf8");
const details = readFileSync(new URL("../details/InspectorDetails.tsx", import.meta.url), "utf8");
const section = readFileSync(new URL("../section/InspectorSectionView.tsx", import.meta.url), "utf8");
const steps = readFileSync(new URL("../steps/InspectorSteps.tsx", import.meta.url), "utf8");
const select = readFileSync(new URL("../../../common/select/AnimatedSelect.tsx", import.meta.url), "utf8");
const modal = readFileSync(new URL("../../../common/modal/Modal.tsx", import.meta.url), "utf8");

test("markdown fields use an edit-only toolbar and never render raw HTML", () => {
  assert.match(source, /preview="edit"/);
  assert.match(source, /extraCommands=\{\[\]\}/);
  assert.match(source, /commands\.bold/);
  assert.match(source, /commands\.orderedListCommand/);
  assert.match(source, /urlTransform=\{safeUrl\}/);
  assert.equal(source.match(/skipHtml/g)?.length, 2);
});

test("rich text is scoped to narrative test-case fields", () => {
  assert.match(content, /value=\{value\.description\}/);
  assert.match(content, /value=\{value\.preconditions\}/);
  assert.match(details, /value=\{revision\.testData\}/);
  assert.match(steps, /value=\{step\.action\}/);
  assert.doesNotMatch(content, /<MarkdownField[^>]+value=\{value\.component\}/s);
});

test("section snapshots and rich field labels remain interaction-safe", () => {
  assert.match(content, /if \(snapshots\.current\[section\]\) return/);
  assert.match(section, /!props\.persistentEditing && !active/);
  assert.match(details, /className=\{`\$\{css\.wideField\} \$\{css\.markdownControl\}`\}/);
  assert.match(steps, /className=\{css\.markdownControl\}/);
  const markdownInsideLabel = /<label[^>]*>(?:(?!<\/label>)[\s\S])*<MarkdownField/;
  assert.doesNotMatch(details, markdownInsideLabel);
  assert.doesNotMatch(steps, markdownInsideLabel);
});

test("a handled select Escape cannot close its containing modal", () => {
  assert.equal(select.match(/event\.stopPropagation\(\)/g)?.length, 2);
  assert.match(modal, /if \(event\.defaultPrevented\) return/);
});

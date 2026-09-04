import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const view = readFileSync(fileURLToPath(new URL("../navigator/RunNavigator.tsx", import.meta.url)), "utf8");
const marquee = readFileSync(fileURLToPath(new URL("../navigator/RunNameMarquee.tsx", import.meta.url)), "utf8");
const styles = readFileSync(fileURLToPath(new URL("../navigator/run-navigator.module.css", import.meta.url)), "utf8");
const executionHeader = readFileSync(fileURLToPath(new URL("../header/RunExecutionHeader.tsx", import.meta.url)), "utf8");
const runsView = readFileSync(fileURLToPath(new URL("../RunsView.tsx", import.meta.url)), "utf8");
const runStyles = readFileSync(fileURLToPath(new URL("../runs.module.css", import.meta.url)), "utf8");

test("run picker keeps long names compact and calmly reveals their full text", () => {
  assert.match(view, /className=\{styles\.pickerTriggerText\}/);
  assert.match(view, /<RunNameMarquee name=\{selectedRun\?\.name \?\? emptyLabel\} motion="always" \/>/);
  assert.match(view, /<RunNameMarquee name=\{run\.name\} motion="interaction" \/>/);
  assert.doesNotMatch(view, /<small>\{selectedRun\.key\}<\/small>/);
  assert.match(marquee, /title=\{name\}/);
  assert.match(marquee, /content\.scrollWidth - viewport\.clientWidth/);
  assert.match(marquee, /data-overflow=\{distance > 0 \|\| undefined\}/);
  assert.match(styles, /\.runNameViewport\s*\{[^}]*overflow: hidden;[^}]*white-space: nowrap;/s);
  assert.match(styles, /animation: run-name-pan var\(--run-name-duration\) ease-in-out [^;]* infinite alternate;/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.runNameAlways\[data-overflow="true"\][\s\S]*animation: none;/);
  assert.match(styles, /\.pickerTrigger, \.pickerCreate\s*\{[^}]*min-height: 34px;/s);
  assert.match(styles, /\.pickerOption, \.pickerOptionActive\s*\{[^}]*min-height: 42px;/s);
});

test("run execution identifies the case type from its immutable snapshot", () => {
  assert.match(runsView, /<TypeBadge locale=\{locale\} type=\{selectedItem\.snapshot\.type\}/);
  assert.match(view, /<CaseTypeIcon locale=\{locale\} type=\{testCase\.type\}/);
});

test("run execution follows the test-case list and detail hierarchy", () => {
  assert.match(view, /className=\{styles\.itemsToolbar\}/);
  assert.match(view, /className=\{styles\.itemColumns\}/);
  assert.match(view, /className=\{styles\.itemKey\}/);
  assert.match(styles, /\.item, \.itemActive\s*\{[^}]*min-height: 48px;/s);
  assert.match(runsView, /className=\{runStyles\.overviewLayout\}/);
  assert.match(runsView, /className=\{runStyles\.sideRail\}/);
  assert.match(runsView, /<PriorityBadge locale=\{locale\} priority=\{selectedItem\.snapshot\.priority\}/);
  assert.match(runsView, /<EstimateBadge locale=\{locale\} minutes=\{selectedItem\.snapshot\.estimatedMinutes\}/);
  assert.match(executionHeader, /Кейс \$\{itemIndex \+ 1\} из \$\{itemCount\}/);
  assert.match(runStyles, /\.overviewLayout\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(178px, 31%\);/s);
});

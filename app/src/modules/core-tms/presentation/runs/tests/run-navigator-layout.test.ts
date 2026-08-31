import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const view = readFileSync(fileURLToPath(new URL("../navigator/RunNavigator.tsx", import.meta.url)), "utf8");
const marquee = readFileSync(fileURLToPath(new URL("../navigator/RunNameMarquee.tsx", import.meta.url)), "utf8");
const styles = readFileSync(fileURLToPath(new URL("../navigator/run-navigator.module.css", import.meta.url)), "utf8");

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
  assert.match(styles, /\.pickerTrigger\s*\{[^}]*min-height: 32px;/s);
  assert.match(styles, /\.pickerOptionActive\s*\{[^}]*min-height: 40px;/s);
});

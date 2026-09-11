import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../defect/InlineDefectComposer.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../dialogs/defect-layout/defect-form.module.css", import.meta.url), "utf8");
const runs = readFileSync(new URL("../RunsView.tsx", import.meta.url), "utf8");
const shortcuts = readFileSync(new URL("../execution/useRunKeyboardShortcuts.ts", import.meta.url), "utf8");

test("failed-step defect creation uses the calm right drawer", () => {
  assert.match(source, /drawer panelClassName=/);
  assert.match(source, /dismiss\(onClose\)/);
  assert.match(source, /className=\{surface\.upload\}/);
  assert.doesNotMatch(source, /runStyles\.defectGrid|dropFiles/);
  assert.match(styles, /\.panel\s*\{[^}]*680px/);
  assert.match(styles, /\.upload\s*\{[^}]*min-height: 44px/s);
});

test("defect reporting requires an exact snapshot procedure step", () => {
  assert.match(runs, /failed && failedStep && <button[\s\S]*data-testid="report-defect"/);
  assert.match(shortcuts, /hasFailure && hasProcedure/);
});

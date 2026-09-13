import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runs = readFileSync(new URL("../RunsView.tsx", import.meta.url), "utf8");
const shortcuts = readFileSync(new URL("../execution/useRunKeyboardShortcuts.ts", import.meta.url), "utf8");

test("defect reporting requires an exact snapshot procedure step", () => {
  assert.match(runs, /failed && failedStep && <button[\s\S]*data-testid="report-defect"/);
  assert.match(shortcuts, /hasFailure && hasProcedure/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("workspace loading keeps copy screen-reader-only", () => {
  const workspaceSource = readFileSync(
    new URL("../WorkspaceLoadState.tsx", import.meta.url),
    "utf8",
  );
  const loaderSource = readFileSync(
    new URL("../../common/loading/SaturnLoader.tsx", import.meta.url),
    "utf8",
  );
  const loadingBranch = workspaceSource.slice(
    workspaceSource.indexOf("if (!failure)"),
    workspaceSource.indexOf("const status"),
  );

  assert.match(loadingBranch, /testId="workspace-loading"/);
  assert.match(loadingBranch, /SaturnLoader/);
  assert.match(loaderSource, /aria-busy="true"/);
  assert.match(loaderSource, /styles\.srOnly/);
  assert.match(loaderSource, /workspaceLoaderOrbit/);
  assert.doesNotMatch(loadingBranch, /workspace\.loadingDescription|<h1|<p/);
});

test("resource hydration uses Saturn instead of a false empty state", () => {
  const casesSource = readFileSync(
    new URL("../../cases/CasesView.tsx", import.meta.url),
    "utf8",
  );
  const suitesSource = readFileSync(
    new URL("../../suites/SuitesView.tsx", import.meta.url),
    "utf8",
  );
  const runsSource = readFileSync(
    new URL("../../runs/RunsView.tsx", import.meta.url),
    "utf8",
  );

  assert.match(casesSource, /!revision \? <SaturnLoader/);
  assert.match(suitesSource, /!detail \? <SaturnLoader/);
  assert.match(runsSource, /selectedRun && selectedIsVisible && !selectedItem/);
  assert.match(runsSource, /testId="run-item-loading"/);
});

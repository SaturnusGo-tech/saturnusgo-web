import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("workspace loading keeps copy screen-reader-only", () => {
  const workspaceSource = readFileSync(
    new URL("../WorkspaceLoadState.tsx", import.meta.url),
    "utf8",
  );
  const loaderSource = readFileSync(
    new URL("../../common/loading/TessiqLoader.tsx", import.meta.url),
    "utf8",
  );
  const loadingBranch = workspaceSource.slice(
    workspaceSource.indexOf("if (!failure)"),
    workspaceSource.indexOf("const status"),
  );

  assert.match(loadingBranch, /testId="workspace-loading"/);
  assert.match(loadingBranch, /TessiqLoader/);
  assert.match(loaderSource, /aria-busy="true"/);
  assert.match(loaderSource, /styles\.srOnly/);
  assert.match(loaderSource, /workspaceLoaderBrand/);
  assert.doesNotMatch(loaderSource, /workspaceLoaderPulse/);
  assert.doesNotMatch(loadingBranch, /workspace\.loadingDescription|<h1|<p/);
});

test("resource hydration uses the branded loader instead of a false empty state", () => {
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

  assert.match(casesSource, /!props\.editor && props\.testCase && !props\.revision/);
  assert.match(casesSource, /<TessiqLoader[^>]*testId="case-detail-loading"/);
  assert.match(casesSource, /props\.detailLoadError/);
  assert.match(casesSource, /data-testid="case-detail-error"/);
  assert.match(casesSource, /onClick=\{props\.onRetryDetail\}/);
  assert.match(suitesSource, /!detail \? <TessiqLoader/);
  assert.match(runsSource, /selectedRun && selectedIsVisible && !selectedItem/);
  assert.match(runsSource, /testId="run-item-loading"/);
});

test("case detail hydration exposes a retryable failure state", () => {
  const resourceSource = readFileSync(
    new URL("../../../state/case-resource/useSelectedCaseResource.ts", import.meta.url),
    "utf8",
  );

  assert.match(resourceSource, /setFailed\(true\)/);
  assert.match(resourceSource, /setRequestVersion\(\(current\) => current \+ 1\)/);
  assert.match(resourceSource, /if \(!controller\.signal\.aborted\)/);
  assert.doesNotMatch(resourceSource, /catch\(\(\) => \{\}\)/);
});

test("case creation controls preserve an active editor", () => {
  const toolbarSource = readFileSync(
    new URL("../../cases/toolbar/CasesToolbar.tsx", import.meta.url),
    "utf8",
  );
  const controllerSource = readFileSync(
    new URL("../../cases/view/useCasesViewController.ts", import.meta.url),
    "utf8",
  );

  assert.match(toolbarSource, /interactionLocked\?: boolean/);
  assert.match(toolbarSource, /aria-disabled=\{props\.interactionLocked \|\| undefined\}/);
  assert.match(toolbarSource, /guardCreateInteraction/);
  assert.match(controllerSource, /document\.getElementById\("case-editor-actions"\)\?\.focus\(\)/);
});

test("project switching resets editors only after a successful load", () => {
  const actionsSource = readFileSync(
    new URL("../../../state/workspace-actions/useWorkspaceActions.ts", import.meta.url),
    "utf8",
  );
  const stageSource = readFileSync(
    new URL("../../workspace-stage/WorkspaceStage.tsx", import.meta.url),
    "utf8",
  );
  const casesStageSource = readFileSync(
    new URL("../../workspace-stage/cases/WorkspaceCasesStage.tsx", import.meta.url),
    "utf8",
  );
  const failureGuard = actionsSource.indexOf('if (state.connection !== "demo" && !remote) return;');
  const reset = actionsSource.indexOf("state.resetCaseEditor(");

  assert.ok(failureGuard >= 0);
  assert.ok(reset > failureGuard);
  assert.match(actionsSource.slice(failureGuard), /state\.setQuery\(""\)/);
  assert.match(actionsSource.slice(failureGuard), /state\.setCaseFilters\(\{/);
  assert.match(stageSource, /<WorkspaceCasesStage model=\{model\}/);
  assert.match(casesStageSource, /<CasesView key=\{model\.project!\.id\}/);
});

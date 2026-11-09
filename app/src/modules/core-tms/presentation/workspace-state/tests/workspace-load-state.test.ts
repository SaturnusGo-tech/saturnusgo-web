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
    workspaceSource.indexOf("<section"),
  );

  assert.match(loadingBranch, /testId="workspace-loading"/);
  assert.match(loadingBranch, /<TessiqLoader pane branded/);
  assert.match(loaderSource, /aria-busy="true"/);
  assert.match(loaderSource, /styles\.srOnly/);
  assert.match(loaderSource, /workspaceLoaderMark[^\n]*\n\s*<LoadingOrb size="brand"/);
  assert.match(loaderSource, /if \(pane && !branded\) return <ContentSkeleton/);
  assert.doesNotMatch(loaderSource, /workspaceLoaderPulse/);
  assert.doesNotMatch(loadingBranch, /workspace\.loadingDescription|<h1|<p/);
});

test("case and run hydration use their own pending presentations", () => {
  const casesSource = readFileSync(
    new URL("../../cases/CasesView.tsx", import.meta.url),
    "utf8",
  );
  const runsSource = readFileSync(
    new URL("../../runs/RunsView.tsx", import.meta.url),
    "utf8",
  );

  assert.match(casesSource, /!props\.editor && props\.testCase && !props\.revision/);
  assert.match(casesSource, /role="status" data-testid="case-detail-loading"/);
  assert.doesNotMatch(casesSource, /<TessiqLoader/);
  assert.match(casesSource, /props\.detailLoadError/);
  assert.match(casesSource, /data-testid="case-detail-error"/);
  assert.match(casesSource, /onClick=\{props\.onRetryDetail\}/);
  assert.match(runsSource, /!selectedRun \|\| !selectedItem/);
  assert.match(runsSource, /data-testid="run-item-loading"[\s\S]*?<LoadingOrb size="lg"/);
});

test("run preparation preserves the production test-case list", () => {
  const runScopeSource = readFileSync(
    new URL("../../dialogs/run/RunDialog.tsx", import.meta.url),
    "utf8",
  );
  const embeddedListSource = readFileSync(
    new URL("../../cases/embedded/EmbeddedCaseList.tsx", import.meta.url),
    "utf8",
  );
  const embeddedListStyles = readFileSync(
    new URL("../../cases/embedded/embeddedCaseList.module.css", import.meta.url),
    "utf8",
  );

  assert.match(runScopeSource, /<SelectionTree/);
  assert.match(embeddedListSource, /<LifecycleBadge/);
  assert.match(embeddedListSource, /<PrioritySignal/);
  assert.match(embeddedListSource, /prioritySortButton/);
  assert.doesNotMatch(embeddedListSource, /<PriorityBadge/);
  assert.match(embeddedListSource, /<CaseTypeIcon/);
  assert.match(embeddedListStyles, /grid-template-columns: 32px 36px 90px 94px minmax\(220px, 1fr\)/);
});

test("case detail hydration exposes a retryable failure state", () => {
  const resourceSource = readFileSync(
    new URL("../../../state/case-resource/useSelectedCaseResource.ts", import.meta.url),
    "utf8",
  );

  assert.match(resourceSource, /setFailedCaseId\(caseId\)/);
  assert.match(resourceSource, /failed: failedCaseId === caseId/);
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
  const failureGuard = actionsSource.indexOf('if (state.connection !== "demo" && !remote) return false;');
  const reset = actionsSource.indexOf("state.resetCaseEditor(");

  assert.ok(failureGuard >= 0);
  assert.ok(reset > failureGuard);
  assert.match(actionsSource.slice(failureGuard), /state\.setQuery\(""\)/);
  assert.match(actionsSource.slice(failureGuard), /state\.setCaseFilters\(\{/);
  assert.match(stageSource, /<WorkspaceCasesStage model=\{model\}/);
  assert.match(casesStageSource, /<CasesView key=\{model\.repositoryScope\.aggregate \? model\.repositoryScope\.key : model\.project\?\.id\}/);
});

test("suite detail failures remain retryable and do not become empty suites", () => {
  const resource = readFileSync(new URL("../../../state/workspace-resources/useSelectedSuiteResource.ts", import.meta.url), "utf8");
  const detail = readFileSync(new URL("../../suites/detail/SuiteDetail.tsx", import.meta.url), "utf8");
  assert.match(resource, /if \(!controller.signal.aborted\) setFailed\(true\)/);
  assert.match(resource, /setRequestVersion\(\(current\) => current \+ 1\)/);
  assert.doesNotMatch(resource, /catch\(\(\) => \{\}\)/);
  assert.match(detail, /props.error && !detail/);
  assert.match(detail, /data-testid="suite-detail-error"/);
  assert.match(detail, /onClick=\{preview.error \? preview.retry : props.onRetry\}/);
});

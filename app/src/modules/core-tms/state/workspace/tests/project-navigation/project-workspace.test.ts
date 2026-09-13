import assert from "node:assert/strict";
import test from "node:test";
import { projectHref, workspaceHarness } from "./workspace-harness";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";

test("opening runs without a deep link selects current work and stays empty when only history remains", () => {
  for (const hasDraft of [true, false]) {
    const app = workspaceHarness("https://tms.example/work/?workspaceId=w&projectId=p&view=runs");
    app.bootstrap.data.runs = [{ id: "old", projectId: "p", status: "completed", archivedAt: null, createdAt: "2026-09-13" } as TestRunSummary];
    if (hasDraft) app.bootstrap.data.runs.push({ id: "draft", projectId: "p", status: "draft", archivedAt: null, createdAt: "2026-09-12" } as TestRunSummary);
    const state = app.render();
    assert.equal(state.selectedRunId, hasDraft ? "draft" : null);
    assert.equal(new URL(app.h.window.location.href).searchParams.get("runId"), hasDraft ? "draft" : null);
    app.h.dispose();
  }
});

test("explicit historical run links remain readable after default selection changes", () => {
  const app = workspaceHarness("https://tms.example/work/?workspaceId=w&projectId=p&view=runs&runId=old&runItemId=old-item");
  app.bootstrap.data.runs = [{ id: "old", projectId: "p", status: "completed", archivedAt: null } as TestRunSummary];
  const state = app.render(); assert.equal(state.selectedRunId, "old"); assert.equal(state.selectedRunItemId, "old-item");
  app.h.dispose();
});

test("workspace bootstrap restores an embedded case and writes its URL without jumping to the global case page", () => {
  const app = workspaceHarness(); const state = app.render();
  assert.equal(state.view, "portfolios"); assert.equal(state.projectId, "p"); assert.equal(state.selectedCaseId, "c");
  assert.equal(state.selectedFolder, "/Платежи/Переводы");
  const query = new URL(app.h.window.location.href).searchParams;
  assert.equal(query.get("view"), "portfolios"); assert.equal(query.get("catalogProjectId"), "p");
  assert.equal(query.get("folderId"), "transfers"); assert.equal(query.get("caseId"), "c");
  state.setSelectedCaseId(""); app.render();
  assert.equal(new URL(app.h.window.location.href).searchParams.get("caseId"), null);
  assert.equal(new URL(app.h.window.location.href).searchParams.get("folderId"), "transfers");
  app.h.dispose();
});
test("global creation and foreign project case URLs never bootstrap a stale inspector", () => {
  for (const href of [`${projectHref}&organizationCreate=project&caseId=c`, `${projectHref}&caseId=foreign`]) {
    const app = workspaceHarness(href); const state = app.render();
    assert.equal(state.selectedCaseId, ""); assert.equal(state.view, "portfolios");
    assert.equal(new URL(app.h.window.location.href).searchParams.get("caseId"), null);
    app.h.dispose();
  }
});
test("selecting a leaf in another folder updates its deep-link folder before reload or inspector close", () => {
  const app = workspaceHarness(); const state = app.render();
  state.setSelectedCaseId("c2"); app.render();
  assert.equal(new URL(app.h.window.location.href).searchParams.get("folderId"), "profile");
  state.setSelectedCaseId(""); app.render();
  assert.equal(new URL(app.h.window.location.href).searchParams.get("folderId"), "profile");
  app.h.dispose();
});
test("a stale case selection from another loaded project cannot redirect the active project", () => {
  const app = workspaceHarness(); const state = app.render(); const before = app.h.window.location.href;
  state.setSelectedCaseId("foreign"); app.render();
  assert.equal(app.h.window.location.href, before);
  assert.equal(state.projectId, "p"); app.h.dispose();
});

test("an embedded case update while its pane is hidden preserves the overview tab", () => {
  const app = workspaceHarness(`${projectHref.replace("projectTab=cases", "projectTab=overview")}&caseId=c`);
  const state = app.render();
  state.setSelectedCaseId("c2"); app.render();
  const query = new URL(app.h.window.location.href).searchParams;
  assert.equal(query.get("projectTab"), "overview"); assert.equal(query.get("view"), "portfolios");
  assert.equal(query.get("catalogProjectId"), "p"); assert.equal(query.get("caseId"), "c2");
  app.h.dispose();
});

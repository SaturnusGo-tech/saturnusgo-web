import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../../state/navigation/browser/tests/project/hook-harness";
import { isProjectCaseContext } from "../../../test-cases/navigation/project/project-case-context";
import type { useFolderNavigation } from "../useFolderNavigation";

const base = "https://tms.example/work/?workspaceId=w&projectId=p&view=portfolios&catalogProjectId=p&projectTab=cases";
function setup(href = base) {
  const h = hookHarness(href);
  const state = { view: "portfolios", projectId: "p", dialog: null as string | null, selectedCaseId: "", selectedFolder: "", selectedFolderId: "",
    data: { workspace: { id: "w" }, testCases: [{ id: "c", projectId: "p", folderId: "transfers", folderPath: "/Платежи/Переводы" }, { id: "foreign", projectId: "other", folderId: "foreign-folder", folderPath: "/Other" }] },
    setSelectedCaseId: (id: string) => { state.selectedCaseId = id; }, setSelectedFolder: (path: string) => { state.selectedFolder = path; }, setSelectedFolderId: (id: string) => { state.selectedFolderId = id; } };
  const resource = { loading: false, items: [{ id: "transfers", path: "/Платежи/Переводы", archivedAt: null }, { id: "saved-empty", path: "/Empty", archivedAt: null }] };
  const hook = h.load<{ useFolderNavigation: typeof useFolderNavigation }>(new URL("../useFolderNavigation.ts", import.meta.url), (name) => {
    if (name.endsWith("project-case-context")) return { isProjectCaseContext };
    if (name.endsWith("workspace-history")) return { navigateWorkspace: h.navigate };
    throw new Error(name);
  }).useFolderNavigation;
  const render = () => h.render(() => hook(state as unknown as Parameters<typeof hook>[0], resource as unknown as Parameters<typeof hook>[1]));
  return { h, state, resource, render };
}
test("selecting a nested folder keeps the project page and clears only its inspector", () => {
  const app = setup(`${base}&caseId=c`); app.state.selectedCaseId = "c";
  app.render()("/Платежи/Переводы", "transfers");
  const query = new URL(app.h.window.location.href).searchParams;
  assert.equal(query.get("view"), "portfolios"); assert.equal(query.get("catalogProjectId"), "p");
  assert.equal(query.get("projectTab"), "cases"); assert.equal(query.get("folderId"), "transfers"); assert.equal(query.get("caseId"), null);
  assert.equal(app.state.selectedCaseId, ""); assert.equal(app.state.selectedFolderId, "transfers");
  app.h.dispose();
});
test("Back restores durable empty folders and root; selected case owns its folder without adopting foreign cases", () => {
  const app = setup(`${base}&folderId=saved-empty`); app.render();
  assert.equal(app.state.selectedFolder, "/Empty");
  app.h.window.location.href = `${base}&folderId=root`; app.h.emit("popstate");
  assert.equal(app.state.selectedFolder, "/"); assert.equal(app.state.selectedFolderId, "root");
  app.state.selectedCaseId = "c"; app.h.window.location.href = `${base}&caseId=c`; app.render();
  assert.equal(app.state.selectedFolderId, "transfers");
  app.state.selectedCaseId = "foreign"; app.render(); assert.equal(app.state.selectedFolderId, "transfers");
  app.h.dispose();
});
test("folder restore waits for scoped resources and folder navigation respects an open editor", () => {
  const app = setup(`${base}&folderId=transfers`); app.resource.loading = true; app.render();
  assert.equal(app.state.selectedFolder, "");
  app.resource.loading = false; app.render(); assert.equal(app.state.selectedFolderId, "transfers");
  app.state.dialog = "case"; app.render()("/Empty", "saved-empty"); assert.equal(app.h.writes.length, 0);
  app.h.window.location.href = `${base.replace("projectId=p", "projectId=other")}&folderId=saved-empty`;
  app.h.emit("popstate"); assert.equal(app.state.selectedFolderId, "transfers");
  app.h.dispose();
});

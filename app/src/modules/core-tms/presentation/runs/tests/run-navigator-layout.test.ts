import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useSelectedRunResource } from "../../../state/run-resource/useSelectedRunResource";
import { runScopeState } from "../state/run-view-state";
import { runRepositoryEntries, runRepositoryFolders } from "../../../runs/batches/model/repository/run-repository";
import { buildFolderTree } from "../../../folders/model/tree";
import type { RunItemSummary } from "../../../../../core/tms/contracts/legacy-contract";

test("a selected run starts pending before effects, even though its initial item list is empty", () => {
  let state: ReturnType<typeof useSelectedRunResource> | undefined;
  function Probe() {
    state = useSelectedRunResource({
      http: {} as Parameters<typeof useSelectedRunResource>[0]["http"], connection: "connected", projectId: "p", selectedRunId: "run",
      selectedRunItemId: "item", setSelectedRunItemId: () => {}, setData: () => {},
    });
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  assert.ok(state);
  assert.equal(state.runResourceReady, false);
  assert.equal(state.runResourceLoading, true);
  assert.deepEqual(state.runItems, []);
  assert.equal(runScopeState(state.runResourceLoading, state.runItems.length), "loading");
});

test("pending scope and authoritative empty scope are different render states", () => {
  // The run summary can already exist while /items is delayed, or while retrying.
  assert.equal(runScopeState(true, 0), "loading");
  assert.equal(runScopeState(true, 6), "loading");
  assert.equal(runScopeState(false, 6), "ready");
  assert.equal(runScopeState(false, 0), "empty");
});


test("run repository uses captured case metadata and keeps identical case IDs in different runs separate", () => {
  const item: RunItemSummary = { id: "item-a", caseId: "case-a", caseKey: "API-1", revision: 2,
    assigneeIdentityId: "qa", status: "passed", attemptCount: 1, activeAttemptNo: 1,
    createdAt: "2026-09-11T00:00:00Z", updatedAt: "2026-09-11T00:00:00Z",
    preview: { title: "Original title", type: "manual", lifecycle: "ready", priority: "high",
      component: "API", tags: ["smoke"], estimatedMinutes: 5, folderPath: "/API/Auth" } };
  const rows = runRepositoryEntries("run-a", "project-a", [item]);
  assert.equal(rows[0].testCase.title, "Original title");
  assert.equal(rows[0].testCase.id, "item-a");
  assert.equal(rows[0].testCase.ownerIdentityId, "qa");
  const folders = runRepositoryFolders("w", "project-a", rows.map((r) => r.testCase));
  const tree = buildFolderTree(folders, rows.map((r) => r.testCase));
  assert.equal(tree.roots[0].folder.name, "API");
  assert.deepEqual(tree.roots[0].children[0].caseIds, ["item-a"]);
  const legacy = runRepositoryEntries("old", "project-a", [{ ...item, preview: { ...item.preview!, folderPath: null } }]);
  assert.equal(buildFolderTree([], legacy.map((r) => r.testCase)).unfiled.length, 1);
});

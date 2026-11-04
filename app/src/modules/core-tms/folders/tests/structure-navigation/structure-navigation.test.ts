import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../../state/navigation/browser/tests/project/hook-harness";
import { buildCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import { buildWorkspaceDeepLink } from "../../../state/navigation/workspace-deep-link";

test("structure navigation keeps the selected case and handles Back, Forward and close", () => {
  const original = "https://tms.example/work/?workspaceId=w&projectId=p&caseId=c";
  const h = hookHarness(original);
  const hook = h.load<{ useFolderStructureScreen: () => { open: boolean; focusFolderId?: string; show: (id?: string) => void; close: () => void; clearFocus: () => void } }>(new URL("../../state/structure/useFolderStructureScreen.ts", import.meta.url), name => {
    assert.ok(name.endsWith("workspace-history"));
    return { HISTORY_CHANGE: "falcon:navigation", visitWorkspace(href: string) { h.navigate(new URL(href, h.window.location.href).href); h.emit("popstate"); } };
  }).useFolderStructureScreen;
  assert.equal(h.settle(hook).open, false);
  h.settle(hook).show("target-folder");
  const opened = h.window.location.href;
  assert.equal(new URL(opened).hash, "#folders"); assert.equal(new URL(opened).searchParams.get("caseId"), "c");
  assert.equal(h.settle(hook).open, true);
  assert.equal(h.settle(hook).focusFolderId, "target-folder");
  h.settle(hook).clearFocus(); assert.equal(h.settle(hook).focusFolderId, undefined);
  h.navigate(original); h.emit("popstate"); assert.equal(h.settle(hook).open, false);
  h.navigate(opened); h.emit("popstate"); assert.equal(h.settle(hook).open, true);
  h.settle(hook).close(); assert.equal(h.window.location.href, original); assert.equal(h.settle(hook).open, false);
  h.navigate(opened); h.emit("falcon:navigation"); assert.equal(h.settle(hook).open, true);
  h.navigate(original); h.emit("falcon:navigation"); assert.equal(h.settle(hook).open, false);
  h.settle(hook).show(); assert.equal(h.settle(hook).focusFolderId, undefined);
  h.dispose();
});

test("folder structure survives canonicalization only in its repository project scope", () => {
  const href = "https://tms.example/work/?workspaceId=w&projectId=p&view=cases#folders";
  const scope = { workspaceId: "w", projectId: "p", view: "cases" as const, runId: null };
  assert.equal(buildWorkspaceDeepLink(href, scope), href);
  for (const next of [{ ...scope, projectId: "q" }, { ...scope, workspaceId: "other" }, { ...scope, view: "dashboard" as const }])
    assert.equal(new URL(buildWorkspaceDeepLink(href, next)).hash, "");
});


test("selected-case canonicalization retains the structure route only for the same selected case and scope", () => {
  const href = "https://tms.example/work/?workspaceId=w&projectId=p&caseId=c#folders";
  const scope = { workspaceId: "w", projectId: "p", caseId: "c" };
  const options = { preserveFolderStructure: true };
  assert.equal(new URL(buildCaseDeepLink(href, scope, options)).hash, "#folders");
  for (const next of [{ ...scope, projectId: "q" }, { ...scope, workspaceId: "other" }, { ...scope, caseId: "next" }])
    assert.equal(new URL(buildCaseDeepLink(href, next, options)).hash, "");
  assert.equal(new URL(buildCaseDeepLink(href, scope)).hash, "");
});

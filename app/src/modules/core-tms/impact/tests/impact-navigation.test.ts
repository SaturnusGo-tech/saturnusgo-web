import assert from "node:assert/strict";
import test from "node:test";
import { impactHref, readImpactSelection, safeImpactLink } from "../navigation/impact-navigation";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";
import { ImpactOperations, impactJournalOwner } from "../application/commands/impact-operation";
import { impactPermissions, impactCommandAllowed } from "../model/impact-types";
import { scope, storageFixture } from "./fixtures/impact-fixture";
test("a no-run analysis survives workspace canonicalization and reload without stale run or defect selection", () => {
  const href = impactHref("https://tms.falcon.test/work/?runId=old&defectId=old&integration=slack#old", scope, "analysis_qa");
  const canonical = buildWorkspaceDeepLink(href, { ...scope, view: "hooks", runId: "old" });
  assert.equal(readImpactSelection(canonical, scope), "analysis_qa");
  assert.deepEqual(readWorkspaceDeepLink(canonical), { view: "hooks", runId: null });
  assert.deepEqual(Object.fromEntries(new URL(canonical).searchParams), { ...scope, view: "hooks", integration: "github", impact: "1", analysisId: "analysis_qa" });
});
test("switching project or leaving GitHub cannot retain a foreign analysis; list URL remains reloadable", () => {
  const href = impactHref("https://tms.falcon.test/work/", scope, "analysis_qa");
  assert.equal(readImpactSelection(href, { ...scope, projectId: "other" }), null);
  const moved = buildWorkspaceDeepLink(href, { ...scope, projectId: "other", view: "hooks", runId: null });
  assert.equal(new URL(moved).searchParams.get("analysisId"), null);
  const run = buildWorkspaceDeepLink(href, { ...scope, view: "runs", runId: "run_qa" });
  assert.equal(new URL(run).searchParams.get("analysisId"), null);
  assert.equal(readImpactSelection(href.replace("integration=github", "integration=slack"), scope), null);
  const list = impactHref(href, scope, null); assert.equal(new URL(list).searchParams.get("impact"), "1");
  assert.equal(readImpactSelection(list, scope), null);
});
test("canonical plugin-manager links open the actual selected analysis and retain their container on selection", () => {
  const manager = new URL("https://tms.falcon.test/work/");
  manager.search = new URLSearchParams({ ...scope, view: "config", settings: "plugins", plugin: "github", impact: "1", analysisId: "analysis_qa" }).toString();
  assert.equal(readImpactSelection(manager.href, scope), "analysis_qa");
  const next = impactHref(`${manager.href}&runId=old&defectId=old#old`, scope, "analysis_next");
  assert.deepEqual(Object.fromEntries(new URL(next).searchParams), { ...scope, view: "config", settings: "plugins", plugin: "github", impact: "1", analysisId: "analysis_next" });
  assert.equal(readImpactSelection(next, scope), "analysis_next");
  const canonical = buildWorkspaceDeepLink(next, { ...scope, view: "config", runId: null });
  assert.equal(readImpactSelection(canonical, scope), "analysis_next");
  const list = impactHref(next, scope, null);
  assert.equal(new URL(list).searchParams.get("plugin"), "github");
  assert.equal(new URL(list).searchParams.get("analysisId"), null); assert.equal(readImpactSelection(list, scope), null);
  for (const foreign of [{ ...scope, workspaceId: "other" }, { ...scope, projectId: "other" }]) assert.equal(readImpactSelection(next, foreign), null);
  const moved = buildWorkspaceDeepLink(next, { ...scope, projectId: "other", view: "config", runId: null });
  assert.equal(readImpactSelection(moved, { ...scope, projectId: "other" }), null);
});
test("unrelated settings and provider routes cannot expose a selected analysis or masquerade as its container", () => {
  for (const query of ["view=config&settings=general&plugin=github", "view=config&settings=plugins&plugin=slack", "view=hooks&integration=slack", "view=runs&integration=github", "view=config&integration=github"]) {
    const href = `https://tms.falcon.test/work/?${new URLSearchParams(scope)}&${query}&analysisId=analysis_qa`;
    assert.equal(readImpactSelection(href, scope), null);
    const target = new URL(impactHref(href, scope, "analysis_next"));
    assert.equal(target.searchParams.get("view"), "hooks"); assert.equal(target.searchParams.get("integration"), "github");
    assert.equal(target.searchParams.has("settings"), false); assert.equal(target.searchParams.has("plugin"), false);
  }
});
test("malformed IDs and unsafe externally supplied hyperlinks do not become navigation targets", () => {
  assert.throws(() => impactHref("https://tms.falcon.test/work/", scope, "../foreign"));
  for (const value of ["javascript:alert(1)", "http://github.com/qa", "https://user:secret@github.com/qa", "/relative", ""]) assert.equal(safeImpactLink(value), undefined);
  assert.equal(safeImpactLink("https://github.com/qa/repo/pull/1"), "https://github.com/qa/repo/pull/1");
});
test("capabilities remain separate: read-only reviewers cannot configure providers or generate drafts", () => {
  assert.deepEqual(impactPermissions(["integration:read", "run:manage"]), { read: true, configure: false, review: true, manageCases: false, audit: false });
  assert.deepEqual(impactPermissions(["integration:read", "run:manage", "test_case:manage", "integration:manage", "audit:read"], false), { read: false, configure: false, review: false, manageCases: false, audit: false });
  assert.equal(impactCommandAllowed({ action: "approve", body: {} }, impactPermissions(["integration:read"])), false);
  assert.equal(impactCommandAllowed({ action: "retry", body: {} }, impactPermissions(["integration:read", "run:manage"])), false);
  assert.equal(impactCommandAllowed({ action: "gaps/gap/generate", body: { mode: "manual" } }, impactPermissions(["integration:read", "test_case:manage"])), true);
});
test("malformed cached operations are ignored and unrelated scope journals remain isolated", () => {
  const storage = storageFixture(); storage.setItem("malformed", JSON.stringify({ key: "key", etag: "v1", command: { action: "../../runs/result", body: {} } }));
  assert.equal(new ImpactOperations("malformed", storage).pending(), null);
  const first = new ImpactOperations("scope-a", storage, () => "key-a"); first.begin({ action: "approve", body: {} }, "v1");
  assert.equal(new ImpactOperations("scope-b", storage).pending(), null); first.complete("key-a");
});
test("switching accounts in the same project cannot replay the previous reviewer's unfinished operation", () => {
  const storage = storageFixture();
  const first = new ImpactOperations(impactJournalOwner("cloud:user-a", scope, "analysis_qa"), storage, () => "account-key");
  first.begin({ action: "scope", body: { caseIds: ["case_a"] } }, "version7");
  const second = new ImpactOperations(impactJournalOwner("cloud:user-b", scope, "analysis_qa"), storage);
  assert.equal(second.pending(), null);
  const returned = new ImpactOperations(impactJournalOwner("cloud:user-a", scope, "analysis_qa"), storage);
  assert.equal(returned.pending()?.key, "account-key"); first.complete("account-key");
});

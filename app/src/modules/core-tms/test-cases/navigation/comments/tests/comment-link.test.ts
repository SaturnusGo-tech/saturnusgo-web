import assert from "node:assert/strict";
import test from "node:test";
import { buildCommentLink } from "../comment-link";
import { buildCaseDeepLink, clearCaseDeepLink } from "../../case-deep-link";

test("shared comment targets its own case and project on the company domain without sender filters", () => {
  const link = new URL(buildCommentLink("https://umbrella-falcon.saturnusgo.com/other/?projectId=wrong&view=portfolios&folderId=private&q=secret&commentId=old#hash", {
    workspaceId: "workspace-a", projectId: "project-a", caseId: "case-a", id: "comment:a",
  }));
  assert.equal(link.origin, "https://umbrella-falcon.saturnusgo.com");
  assert.equal(link.pathname, "/testcases/umbrella-home/work/");
  assert.equal(link.hash, "");
  assert.deepEqual(Object.fromEntries(link.searchParams), {
    workspaceId: "workspace-a", projectId: "project-a", caseId: "case-a", view: "cases", commentId: "comment:a",
  });
});

test("workspace canonicalization retains a shared comment only for the same workspace, project and case", () => {
  const scope = { workspaceId: "w", projectId: "p", caseId: "c" };
  const link = buildCommentLink("https://company.test/", { ...scope, id: "comment-1" });
  const canonical = buildCaseDeepLink(link, scope, { preserveCommentSelection: true });
  assert.equal(new URL(canonical).searchParams.get("commentId"), "comment-1");
  assert.equal(buildCaseDeepLink(canonical, scope, { preserveCommentSelection: true }), canonical);
  for (const next of [{ ...scope, workspaceId: "w2" }, { ...scope, projectId: "p2" }, { ...scope, caseId: "c2" }]) {
    assert.equal(new URL(buildCaseDeepLink(canonical, next, { preserveCommentSelection: true })).searchParams.get("commentId"), null);
  }
  assert.equal(new URL(buildCaseDeepLink(canonical, scope)).searchParams.get("commentId"), null);
  assert.equal(new URL(clearCaseDeepLink(canonical)).searchParams.get("commentId"), null);
});

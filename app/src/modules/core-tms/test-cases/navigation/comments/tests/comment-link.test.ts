import assert from "node:assert/strict";
import test from "node:test";
import { buildCommentLink } from "../comment-link";

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

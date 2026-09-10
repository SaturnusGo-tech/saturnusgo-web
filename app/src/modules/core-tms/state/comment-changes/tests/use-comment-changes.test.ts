import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../navigation/browser/tests/project/hook-harness";
import { upsertNewestComment, type TestCaseComment } from "../../../test-cases/collaboration/model/test-case-collaboration";
import type { useCommentChanges } from "../useCommentChanges";
const comment: TestCaseComment = { id: "comment", projectId: "p", caseId: "a", body: "Original", version: 1,
  author: { identityId: "tester", displayName: "Tester" }, createdAt: "2026-09-11T10:00:00Z" };
function setup() {
  const h = hookHarness("https://example.test");
  let finish!: (comment: TestCaseComment) => void;
  let fail!: (error: Error) => void;
  let requests = 0; let refreshes = 0; let caseId = "a"; let items: TestCaseComment[] = [];
  const hook = h.load<{useCommentChanges: typeof useCommentChanges}>(new URL("../useCommentChanges.ts", import.meta.url), (name) => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("comment-mutations")) return { changeComment: () => { requests++;
      return new Promise<TestCaseComment>((resolve, reject) => { finish = resolve; fail = reject; }); } };
    if (name.endsWith("test-case-collaboration")) return { upsertNewestComment };
    if (name.endsWith("usePagedCaseResource")) return { classifyCollaborationFailure: () => "stale" };
    throw new Error(name);
  }).useCommentChanges;
  const render = () => h.settle(() => hook({ projectId: "p", caseId,
    updateItems: (change) => { items = change(items); }, refresh: () => { refreshes++; } }));
  return { render, h, finish: () => finish({ ...comment, version: 2 }), fail: () => fail(new Error("conflict")),
    navigate: (id: string) => { caseId = id; render(); }, result: () => ({ items, requests, refreshes }) };
}
test("late mutation cannot enter another case or a new visit to the original case", async () => {
  const s = setup(); const promise = s.render().changeComment(comment, { body: "Edited" });
  assert.equal(await s.render().changeComment(comment, null), false);
  s.navigate("b"); s.navigate("a"); s.finish(); assert.equal(await promise, false);
  assert.equal(s.result().items.length, 0); assert.equal(s.result().requests, 1);
});
test("conflict refreshes current comments without replacing the draft or reporting success", async () => {
  const s = setup(); const promise = s.render().changeComment(comment, { body: "Draft" });
  s.fail(); assert.equal(await promise, false); assert.equal(s.render().changeFailure, "stale");
  assert.equal(s.result().items.length, 0); assert.equal(s.result().refreshes, 1);
});
test("unmounted comment mutations cannot update a disposed screen", async () => {
  const s = setup(); const promise = s.render().changeComment(comment, { body: "Draft" });
  s.h.dispose(); s.finish(); assert.equal(await promise, false); assert.equal(s.result().items.length, 0);
});

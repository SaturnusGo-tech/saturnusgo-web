import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../navigation/browser/tests/project/hook-harness";
import { upsertNewestComment, type TestCaseComment } from "../../../test-cases/collaboration/model/test-case-collaboration";
import type { useCommentChanges } from "../useCommentChanges";
function setup() {
  const h = hookHarness("https://example.test");
  let caseId = "a"; let items: TestCaseComment[] = []; let count = 0;
  const finish = new Map<string, (item: TestCaseComment) => void>();
  const hook = h.load<{ useCommentChanges: typeof useCommentChanges }>(new URL("../useCommentChanges.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("comment-mutations")) return { getComment: (_http: unknown, _project: string, _case: string, id: string) => {
      count++; return new Promise<TestCaseComment>(resolve => finish.set(id, resolve));
    } };
    if (name.endsWith("test-case-collaboration")) return { upsertNewestComment };
    if (name.endsWith("usePagedCaseResource")) return { classifyCollaborationFailure: () => "unknown" };
    throw Error(name);
  }).useCommentChanges;
  const render = () => h.settle(() => hook({ projectId: "p", caseId, updateItems: change => { items = change(items); }, refresh: () => {} }));
  const complete = (id: string) => finish.get(id)!({ id, projectId: "p", caseId: "a", body: id, createdAt: "2026-09-11T00:00:00Z", author: { identityId: "u", displayName: "QA" } });
  return { h, render, complete, navigate: (value: string) => { caseId = value; render(); }, result: () => ({ count, items }) };
}
test("deep-link and ancestor reads run concurrently and deduplicate the same comment", async () => {
  const s = setup(); const model = s.render();
  const target = model.revealComment("target");
  assert.equal(model.revealComment("target"), target);
  const parent = model.revealComment("parent");
  assert.equal(s.result().count, 2);
  assert.equal(s.render().changingCommentId, null);
  s.complete("parent"); s.complete("target");
  assert.deepEqual(await Promise.all([parent, target]), [true, true]);
  assert.equal(s.result().items.length, 2);
});
test("late deep-link responses cannot enter another case or a new visit to the original", async () => {
  const s = setup(); const pending = s.render().revealComment("target");
  s.navigate("b"); s.navigate("a"); s.complete("target");
  assert.equal(await pending, false); assert.equal(s.result().items.length, 0);
});
test("unmounted deep-link reads do not update the comments", async () => {
  const s = setup(); const pending = s.render().revealComment("target");
  s.h.dispose(); s.complete("target"); assert.equal(await pending, false);
  assert.equal(s.result().items.length, 0);
});

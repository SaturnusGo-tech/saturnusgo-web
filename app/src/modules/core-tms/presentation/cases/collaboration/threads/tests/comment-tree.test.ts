import test from "node:test";
import assert from "node:assert/strict";
import { commentTree } from "../comment-tree";
import type { TestCaseComment } from "../../../../../test-cases/collaboration/model/test-case-collaboration";
const item = (id: string, parentId: string | null, minute: string) => ({ id, parentId, createdAt: `2026-09-11T10:${minute}:00Z` } as TestCaseComment);
test("replies precede parents in API pagination but nest chronologically in the same thread", () => {
  const root = item("root", null, "00"); const one = item("one", "root", "01");
  const two = item("two", "root", "02"); const nested = item("nested", "one", "03");
  const tree = commentTree([nested,two,one,root]);
  assert.equal(tree.length, 1);
  assert.deepEqual(tree[0].children.map(n=>n.comment.id), ["one","two"]);
  assert.equal(tree[0].children[0].children[0].comment.id, "nested");
});
test("missing parents retain replies and arrive into the correct branch without duplication", () => {
  const child = item("child", "older", "02");
  assert.equal(commentTree([child])[0].comment.id, "child");
  const tree = commentTree([child, { ...item("older",null,"00"), deletedAt: "2026-09-11" }, child]);
  assert.equal(tree.length,1); assert.equal(tree[0].children.length,1);
});
test("cyclic corrupt links cannot hide comments or recurse indefinitely", () => {
  assert.equal(commentTree([item("one","two","01"),item("two","one","02"),item("self","self","03")]).length,3);
});

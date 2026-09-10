import assert from "node:assert/strict";
import test from "node:test";
import { upsertNewestComment } from "../../model/test-case-collaboration";
test("comment insertion is idempotent and keeps newest-first order", () => {
  const older = { id: "c-1", projectId: "p", caseId: "c", body: "Old",
    author: { identityId: "a", displayName: "Ada" }, createdAt: "2026-09-01T08:00:00Z" };
  const newer = { ...older, id: "c-2", body: "New", createdAt: "2026-09-01T09:00:00Z" };
  assert.deepEqual(upsertNewestComment([older, newer], newer).map(({ id }) => id), ["c-2", "c-1"]);
});

import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { findExactCaseReferences } from "../resolveCaseReference";

const record = { id: "case-375", projectId: "project-a", key: "HOST-TC-375", title: "Retry safely", archivedAt: null };
function client(get: (path: string) => Promise<unknown>) { return { get } as TmsHttpClient; }

test("requires exact key and same project, retaining archived records while paginating bounded search", async () => {
  const queries: URLSearchParams[] = [];
  const result = await findExactCaseReferences(client(async path => {
    const query = new URL(path, "https://test").searchParams; queries.push(query);
    return query.has("cursor") ? { data: [{ ...record, archivedAt: "2026-01-01" }], meta: { hasMore: false } } : {
      data: [{ ...record, key: "HOST-TC-3750" }, { ...record, projectId: "wrong-project" }],
      meta: { hasMore: true, nextCursor: "next" },
    };
  }), "project-a", "HOST-TC-375");
  assert.deepEqual(result, [{ id: record.id, projectId: record.projectId, key: record.key, title: record.title }]);
  assert.equal(queries.length, 2);
  for (const query of queries) {
    assert.equal(query.get("projectId"), "project-a");
    assert.equal(query.get("search"), "HOST-TC-375");
    assert.equal(query.get("includeArchived"), "true");
  }
});

test("incomplete or cyclic pagination never certifies a unique match", async () => {
  const result = await findExactCaseReferences(client(async () => ({ data: [record],
    meta: { hasMore: true, nextCursor: "same" } })), "project-a", "HOST-TC-375");
  assert.equal(result, null);
});

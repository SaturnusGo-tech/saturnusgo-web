import assert from "node:assert/strict";
import test from "node:test";
import { createCaseReferenceResolver } from "../caseReferenceResolver";
import type { CaseReference } from "../../domain/caseReference";

const scope = { workspaceId: "workspace-a", projectId: "project-a" };
const record: CaseReference = { id: "case-a", projectId: "project-a", key: "HOST-TC-375", title: "Retry safely" };

test("known scoped records including archives resolve without network and never borrow other-project records", async () => {
  const queries: string[] = [];
  const resolver = createCaseReferenceResolver(scope, [record,
    { ...record, key: "OLD-TC-1", archivedAt: "2026-01-01" },
    { ...record, key: "OTHER-TC-1", projectId: "unlisted" },
  ], [], async (project, key) => { queries.push(`${project}:${key}`); return []; });
  assert.equal((await resolver.resolve(record.key))?.title, record.title);
  assert.equal((await resolver.resolve("OLD-TC-1"))?.title, record.title);
  assert.equal(await resolver.resolve("OTHER-TC-1"), null);
  assert.deepEqual(queries, ["project-a:OTHER-TC-1"]);
  resolver.dispose();
});

test("coalesces pending references and rejects cross-project ambiguous keys", async () => {
  let calls = 0;
  const resolver = createCaseReferenceResolver(scope, [], ["project-b", "project-c", "project-b"], async project => {
    calls += 1;
    return project === "project-a" ? [] : [{ ...record, projectId: project }];
  });
  const first = resolver.resolve(record.key);
  assert.equal(resolver.resolve(record.key), first);
  assert.equal(await first, null);
  assert.equal(await resolver.resolve(record.key), null);
  assert.equal(calls, 3);
  resolver.dispose();
});

test("bounds work, cancels obsolete reads and keeps scope caches separate", async () => {
  let active = 0; let maximum = 0;
  const signals: AbortSignal[] = [];
  const resolver = createCaseReferenceResolver(scope, [], [], async (_project, _key, signal) => {
    active += 1; maximum = Math.max(maximum, active); signals.push(signal);
    await new Promise(resolve => setTimeout(resolve, 3));
    active -= 1;
    return [record];
  });
  const results = Array.from({ length: 10 }, (_, index) => resolver.resolve(`HOST-TC-${index + 1}`));
  await Promise.all(results);
  assert.equal(maximum, 4);
  resolver.dispose();
  assert.ok(signals.every(signal => signal.aborted));
  assert.equal(await resolver.resolve(record.key), null);
  const other = createCaseReferenceResolver({ workspaceId: "workspace-b", projectId: "project-b" }, [], [], async () => []);
  assert.equal(other.peek(record.key), undefined);
  assert.equal(await other.resolve(record.key), null);
  other.dispose();
});

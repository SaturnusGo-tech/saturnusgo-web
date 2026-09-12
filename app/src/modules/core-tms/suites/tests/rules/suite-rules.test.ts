import assert from "node:assert/strict";
import test from "node:test";
import { matchesSuite } from "../../../helpers/suites/matchesSuite";
import { mapSuite } from "../../data/suite-mapper";
import { saveSuite } from "../../../application/suites/saveSuite";
import type { Suite, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
const suite: Suite = { id: "s", projectId: "p", key: "TS-1", name: "Smoke", description: "# Scope", type: "dynamic", caseCount: 0, resolvedCaseCount: 1,
  status: "active", createdAt: "2026-09-12", updatedAt: "2026-09-12", caseIds: [], filter: { tags: ["smoke"], priority: ["high"], lifecycle: ["ready"], folderId: "f", folderPathPrefix: "/old", text: "description only" } };
const folder = { id: "f", projectId: "p", path: "/Web", archivedAt: null } as RepositoryFolder;
const item = { id: "a", projectId: "p", archivedAt: null, tags: ["smoke"], priority: "high", lifecycle: "ready", folderPath: "/Web/Auth", key: "A-1", title: "Login" } as TestCaseSummary;
test("preview respects all saved criteria, descendant folder boundaries, project scope and server text matches", () => {
  const ids = new Set(["a"]);
  assert.equal(matchesSuite(item, suite, [folder], ids), true);
  assert.equal(matchesSuite(item, suite, [folder]), false);
  assert.equal(matchesSuite({ ...item, folderPath: "/Website" }, suite, [folder], ids), false);
  assert.equal(matchesSuite({ ...item, priority: "low" }, suite, [folder], ids), false);
  assert.equal(matchesSuite({ ...item, lifecycle: "draft" }, suite, [folder], ids), false);
  assert.equal(matchesSuite({ ...item, projectId: "other" }, suite, [folder], ids), false);
  assert.equal(matchesSuite({ ...item, archivedAt: "2026-09-12" }, suite, [folder], ids), false);
  assert.equal(matchesSuite(item, suite, [{ ...folder, archivedAt: "2026-09-12" }], ids), false);
});
test("mapped advanced filters and Markdown survive a title-only edit; explicit mode switch clears rules", async () => {
  const mapped = mapSuite(suite); assert.deepEqual(mapped.filter, suite.filter); assert.notEqual(mapped.filter.priority, suite.filter.priority);
  const sent: Record<string, unknown>[] = [];
  const http = { mutateResource: async (_path: string, _method: string, body: Record<string, unknown>) => { sent.push(body); return { data: { ...suite, ...body }, etag: '"s-2"' }; } } as unknown as TmsHttpClient;
  const base = { http, suite: mapped, suiteEtag: '"s-1"', projectId: "p", name: "Release 2.5", description: "## Test plan\n\n- **Login**", caseIds: ["a"], tags: ["smoke", "api"], offline: false, operationKey: "edit-suite" };
  const result = await saveSuite({ ...base, type: "dynamic" });
  assert.deepEqual(sent[0].filter, { ...suite.filter, tags: ["smoke", "api"] }); assert.equal(result.data.description, base.description);
  await saveSuite({ ...base, type: "static" }); assert.deepEqual(sent[1].filter, {}); assert.deepEqual(sent[1].caseIds, ["a"]);
});

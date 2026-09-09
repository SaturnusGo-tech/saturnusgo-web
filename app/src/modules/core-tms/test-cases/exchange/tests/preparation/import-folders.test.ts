import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError, type TmsHttpClient, type TmsMutationOptions } from "../../../../../../core/tms/transport/http";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { prepareImportFolders } from "../../data/folders/prepare-import-folders";
import { buildImportPlan } from "../../application/preview/build-import-plan";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";

const scope = { workspaceId: "workspace", projectId: "project" };
function folder(id: string, path: string, parentId: string | null = null): RepositoryFolder {
  return { ...scope, id, path, parentId, name: path.slice(path.lastIndexOf("/") + 1), rowVersion: 1,
    archivedAt: null, createdAt: "2026-09-09", updatedAt: "2026-09-09", etag: `"folder:${id}:1"` };
}
function plan(existing: RepositoryFolder[] = []) {
  return buildImportPlan(parseTestCaseExchange(JSON.stringify({ schemaVersion: "saturnusgo.tms.test-cases.v2",
    exportedAt: "2026-09-09", project: { name: "Quality", key: "QA" }, folders: ["/A/Empty"], testCases: [] })), "/", existing);
}
test("persists empty folders in parent order, skips existing parents and keeps scope on every request", async () => {
  const requests: { url: string; body: { name: string; parentId: string }; key?: string }[] = [];
  const existing = [folder("folder_a", "/A")];
  const http = { mutateResource: async (url: string, _method: string, body: { name: string; parentId: string }, options: TmsMutationOptions) => {
    requests.push({ url, body, key: options.idempotencyKey });
    return { data: folder("folder_empty", "/A/Empty", "folder_a"), etag: null };
  } } as unknown as TmsHttpClient;
  const result = await prepareImportFolders(http, scope, plan(existing), existing, new AbortController().signal, () => {});
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, "/workspaces/workspace/projects/project/folders");
  assert.deepEqual(requests[0]?.body, { name: "Empty", parentId: "folder_a" });
  assert.equal(result.length, 2);
  assert.match(requests[0]?.key ?? "", /^folder_import_/);
});
test("a partially prepared import reports created parents before failure so retry can continue safely", async () => {
  const prepared: RepositoryFolder[][] = [];
  let calls = 0;
  const http = { mutateResource: async () => {
    calls += 1;
    if (calls === 2) throw new Error("Network unavailable");
    return { data: folder("folder_a", "/A"), etag: null };
  } } as unknown as TmsHttpClient;
  await assert.rejects(prepareImportFolders(http, scope, plan(), [], new AbortController().signal,
    (folders) => prepared.push([...folders])), /Network unavailable/);
  assert.equal(prepared[0]?.[0]?.path, "/A");
  assert.equal(calls, 2);
});
test("a concurrent folder create is reconciled only to the exact active path", async () => {
  const http = { mutateResource: async () => { throw new TmsApiError("Conflict", 409, "request"); },
    get: async () => ({ data: [folder("folder_a", "/A"), folder("folder_empty", "/A/Empty", "folder_a")],
      meta: { nextCursor: null } }),
  } as unknown as TmsHttpClient;
  const result = await prepareImportFolders(http, scope, plan(), [], new AbortController().signal, () => {});
  assert.deepEqual(result.map((item) => item.path), ["/A", "/A/Empty"]);
});

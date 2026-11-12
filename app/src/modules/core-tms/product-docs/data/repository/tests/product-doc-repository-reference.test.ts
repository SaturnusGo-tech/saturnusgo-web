import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { resolveProductDocRepository } from "../product-doc-repository-reference";

const scope = {workspaceId: "w", projectId: "p"};
function fixture(rows = [{id: "folder_1", workspaceId: "w", projectId: "other", path: "Orders/Matching lifecycle", name: "Matching lifecycle"}]) {
  const calls: string[] = [];
  const client = {
    getResource: async (path: string) => { calls.push(path); return {data: {id: "other", name: "Host", checklist: []}}; },
    get: async (path: string) => { calls.push(path); return {data: rows, meta: {nextCursor: null}}; },
  } as unknown as TmsHttpClient;
  return {client, calls};
}

test("folder links resolve only an exact accessible folder and share the scoped catalog request", async () => {
  const {client, calls} = fixture();
  const [byId, byPath] = await Promise.all([
    resolveProductDocRepository(client, scope, {kind: "repository", projectId: "other", folderId: "folder_1"}),
    resolveProductDocRepository(client, scope, {kind: "repository", projectId: "other", folderPath: "Orders/Matching lifecycle"}),
  ]);
  assert.equal(byId?.folder.id, "folder_1");
  assert.equal(byPath?.folder.id, "folder_1");
  assert.equal(byId?.projectName, "Host");
  assert.equal(calls.length, 2);
  assert.match(calls[1], /^\/workspaces\/w\/projects\/other\/folders\?/);
  assert.equal(await resolveProductDocRepository(client, scope, {kind: "repository", projectId: "other", folderPath: "Matching"}), null);
});

test("wrong tenant records and ambiguous legacy paths are never converted into references", async () => {
  const original = {id: "one", workspaceId: "w", projectId: "other", path: "Orders/Matching", name: "Matching"};
  const ambiguous = fixture([original, {...original, id: "two"}]);
  assert.equal(await resolveProductDocRepository(ambiguous.client, scope,
    {kind: "repository", projectId: "other", folderPath: "Orders/Matching"}), null);
  const wrongTenant = fixture([{...original, workspaceId: "private"}]);
  assert.equal(await resolveProductDocRepository(wrongTenant.client, scope,
    {kind: "repository", projectId: "other", folderId: "one"}), null);
});

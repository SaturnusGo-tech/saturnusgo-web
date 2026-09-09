import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { archiveFolderCases, listFolders, moveFolderCases } from "../data/folder-api";

test("folder listing follows bounded pages with tenant scope and supports cancellation", async () => {
  const paths: string[] = [];
  const controller = new AbortController();
  const client = { async get(path: string, signal: AbortSignal) {
    paths.push(path); assert.equal(signal, controller.signal);
    return { data: [], meta: { limit: 100, nextCursor: paths.length === 1 ? "opaque+cursor" : null } };
  } } as unknown as TmsHttpClient;
  assert.deepEqual(await listFolders(client, { workspaceId: "tenant-one", projectId: "project-two" }, controller.signal), []);
  assert.equal(paths.length, 2);
  assert.match(paths[0], /^\/workspaces\/tenant-one\/projects\/project-two\/folders\?/);
  assert.match(paths[1], /cursor=opaque%2Bcursor/);
  assert.match(paths[1], /limit=100/);
  controller.abort();
  await assert.rejects(listFolders(client, { workspaceId: "tenant-one", projectId: "project-two" }, controller.signal), { name: "AbortError" });
});

test("folder move and archive use organizational commands, exact entity etags and stable idempotency keys", async () => {
  const calls: unknown[][] = [];
  const client = { async mutateResource(...args: unknown[]) { calls.push(args); return { data: {}, etag: null }; } } as unknown as TmsHttpClient;
  const scope = { workspaceId: "tenant", projectId: "project" };
  const items = [{ id: "case-one", ifMatch: '"test-case:case-one:v4"' }];
  await moveFolderCases(client, scope, { items, targetFolderId: "folder-two" }, "move-key");
  await moveFolderCases(client, scope, { items, targetFolderId: null }, "remove-key");
  await archiveFolderCases(client, scope, { items }, "archive-key");
  assert.deepEqual(calls[0], ["/workspaces/tenant/projects/project/folders/move-cases", "POST", { items, targetFolderId: "folder-two" }, { idempotencyKey: "move-key" }]);
  assert.deepEqual(calls[1][2], { items, targetFolderId: null });
  assert.equal(calls[2][0], "/workspaces/tenant/projects/project/folders/archive-cases");
  assert.equal(calls.some((call) => String(call[0]).startsWith("/test-cases")), false);
});

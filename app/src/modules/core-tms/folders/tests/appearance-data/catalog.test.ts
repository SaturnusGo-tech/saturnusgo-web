import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { readFolderAppearanceCatalog } from "../../data/appearance/folder-catalog";
const scope = { workspaceId: "workspace-a", projectId: "project-b" };

test("run appearance catalogs use bounded scoped pages and reject cursor loops or foreign metadata", async () => {
  const paths: string[] = [];
  const http = { get: async (path: string) => { paths.push(path); return { data: [{ ...scope, id: "folder" }], meta: { nextCursor: paths.length === 1 ? "next" : null } }; } } as unknown as TmsHttpClient;
  const folders = await readFolderAppearanceCatalog(http, scope, new AbortController().signal);
  assert.equal(folders.length, 2); assert.equal(paths.length, 2);
  assert.match(paths[0]!, /^\/workspaces\/workspace-a\/projects\/project-b\/folders\?limit=100&includeArchived=true$/);
  assert.match(paths[1]!, /cursor=next/);
  const loop = { get: async () => ({ data: [], meta: { nextCursor: "loop" } }) } as unknown as TmsHttpClient;
  await assert.rejects(readFolderAppearanceCatalog(loop, scope, new AbortController().signal), /did not advance/);
  const foreign = { get: async () => ({ data: [{ workspaceId: "elsewhere", projectId: "project-b" }], meta: {} }) } as unknown as TmsHttpClient;
  await assert.rejects(readFolderAppearanceCatalog(foreign, scope, new AbortController().signal), /scoped/);
});

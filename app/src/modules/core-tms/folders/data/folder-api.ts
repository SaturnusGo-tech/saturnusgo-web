import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { FolderScope, RepositoryFolder } from "../model/folder";

type Api = components["schemas"];
export function folderBase(scope: FolderScope) {
  return `/workspaces/${encodeURIComponent(scope.workspaceId)}/projects/${encodeURIComponent(scope.projectId)}/folders`;
}

export async function listFolders(http: TmsHttpClient, scope: FolderScope, signal: AbortSignal) {
  const items: RepositoryFolder[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({ limit: "100", includeArchived: "true" });
    if (cursor) query.set("cursor", cursor);
    const page = await http.get<Api["RepositoryFolderListResponse"]>(`${folderBase(scope)}?${query}`, signal);
    signal.throwIfAborted();
    items.push(...page.data);
    cursor = page.meta.nextCursor ?? null;
    if (cursor && seen.has(cursor)) throw new Error("Folder pagination did not advance.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return items;
}

export function createFolder(http: TmsHttpClient, scope: FolderScope, request: Api["RepositoryFolderCreateRequest"], key: string) {
  return http.mutateResource<RepositoryFolder>(folderBase(scope), "POST", request, { idempotencyKey: key });
}

export function changeFolder(http: TmsHttpClient, scope: FolderScope, folder: RepositoryFolder,
  request: Api["RepositoryFolderPatchRequest"], key: string) {
  return http.mutateResource<RepositoryFolder>(`${folderBase(scope)}/${encodeURIComponent(folder.id)}`, "PATCH", request,
    { idempotencyKey: key, ifMatch: folder.etag });
}

export function transitionFolder(http: TmsHttpClient, scope: FolderScope, folder: RepositoryFolder,
  operation: "archive" | "restore", key: string) {
  return http.mutateResource<RepositoryFolder>(`${folderBase(scope)}/${encodeURIComponent(folder.id)}/${operation}`, "POST",
    operation === "archive" ? { mode: "tree" } : {}, { idempotencyKey: key, ifMatch: folder.etag });
}

export function moveFolderCases(http: TmsHttpClient, scope: FolderScope, request: Api["RepositoryFolderMoveCasesRequest"], key: string) {
  return http.mutateResource<Api["RepositoryFolderMoveCasesResult"]>(`${folderBase(scope)}/move-cases`, "POST", request, { idempotencyKey: key });
}

export function archiveFolderCases(http: TmsHttpClient, scope: FolderScope, request: Api["RepositoryFolderArchiveCasesRequest"], key: string) {
  return http.mutateResource<Api["RepositoryFolderArchiveCasesResult"]>(`${folderBase(scope)}/archive-cases`, "POST", request, { idempotencyKey: key });
}

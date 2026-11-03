import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { FolderScope, RepositoryFolder } from "../../model/folder";
import { folderBase } from "../folder-api";

export async function readFolderAppearanceCatalog(http: TmsHttpClient, scope: FolderScope, signal: AbortSignal) {
  const result: RepositoryFolder[] = []; const seen = new Set<string>(); let cursor: string | null = null;
  for (let page = 0; page < 100; page++) {
    signal.throwIfAborted(); const params = new URLSearchParams({ limit: "100", includeArchived: "true" });
    if (cursor) params.set("cursor", cursor);
    const response = await http.get<components["schemas"]["RepositoryFolderListResponse"]>(`${folderBase(scope)}?${params}`, signal);
    signal.throwIfAborted();
    if (response.data.length > 100 || response.data.some(folder => folder.workspaceId !== scope.workspaceId || folder.projectId !== scope.projectId))
      throw new Error("Invalid scoped folder catalog.");
    result.push(...response.data); cursor = response.meta.nextCursor ?? null;
    if (!cursor) return result;
    if (seen.has(cursor)) throw new Error("Folder pagination did not advance.");
    seen.add(cursor);
  }
  throw new Error("Folder appearance catalog exceeded the page budget.");
}

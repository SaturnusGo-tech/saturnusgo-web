import type { components } from "../../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { FolderScope, RepositoryFolder } from "../../../../folders/model/folder";
import { folderBase, listFolders } from "../../../../folders/data/folder-api";
import type { ImportPlan } from "../../model/import-plan";

type Api = components["schemas"];
export async function prepareImportFolders(http: TmsHttpClient, scope: FolderScope, plan: ImportPlan,
  existing: readonly RepositoryFolder[], signal: AbortSignal,
  progress: (folders: readonly RepositoryFolder[], createdCount: number) => void) {
  const known = new Map(existing.filter((item) => !item.archivedAt).map((item) => [item.path, item]));
  const sorted = [...plan.folders].sort((left, right) => left.path.split("/").length - right.path.split("/").length);
  let createdCount = 0;
  for (const folder of sorted) {
    signal.throwIfAborted();
    if (known.has(folder.path)) continue;
    const parent = folder.parentPath === "/" ? null : known.get(folder.parentPath);
    if (parent === undefined) throw new Error(`Parent folder is unavailable: ${folder.parentPath}`);
    const request: Api["RepositoryFolderCreateRequest"] = { name: folder.name, parentId: parent?.id ?? null };
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${scope.projectId}:${folder.path}`));
    const key = `folder_import_${[...new Uint8Array(hash)].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
    try {
      const result = await http.mutateResource<RepositoryFolder>(folderBase(scope), "POST", request,
        { idempotencyKey: key, signal });
      if (result.data.archivedAt || result.data.path !== folder.path ||
        result.data.workspaceId !== scope.workspaceId || result.data.projectId !== scope.projectId) {
        throw new Error("The imported folder changed. Refresh the project and retry.");
      }
      known.set(folder.path, result.data);
      createdCount += 1;
    } catch (error) {
      if (signal.aborted || !(error instanceof TmsApiError) || error.status !== 409) throw error;
      const refreshed = await listFolders(http, scope, signal);
      const concurrent = refreshed.find((item) => item.path === folder.path && !item.archivedAt);
      if (!concurrent) throw error;
      known.set(folder.path, concurrent);
    }
    progress([...known.values()], createdCount);
  }
  return [...known.values()];
}

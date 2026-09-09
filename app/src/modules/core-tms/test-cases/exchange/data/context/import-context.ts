import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { listFolders } from "../../../../folders/data/folder-api";
import type { RepositoryFolder } from "../../../../folders/model/folder";

type Api = components["schemas"];
export async function loadImportContext(http: TmsHttpClient, projectId: string, signal: AbortSignal,
  known?: Readonly<{ workspaceId: string; folders: readonly RepositoryFolder[] }>) {
  const workspaceId = known?.workspaceId ?? (await http.getResource<Api["Project"]>(
    `/projects/${encodeURIComponent(projectId)}`, signal)).data.workspaceId;
  const scope = { workspaceId, projectId };
  const folders = known?.folders ?? await listFolders(http, scope, signal);
  if (folders.some((folder) => folder.workspaceId !== workspaceId || folder.projectId !== projectId)) {
    throw new Error("Folder scope does not match this project.");
  }
  signal.throwIfAborted();
  return { scope, folders };
}

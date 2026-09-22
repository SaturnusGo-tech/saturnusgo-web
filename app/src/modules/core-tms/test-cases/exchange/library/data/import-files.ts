import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { ImportFile, ImportScope } from "../model/import-file";

type Api = components["schemas"];
const root = (scope: ImportScope) => `/workspaces/${encodeURIComponent(scope.workspaceId)}/projects/${encodeURIComponent(scope.projectId)}/import-files`;
function map(file: Api["ImportFile"]): ImportFile {
  return { id: file.id, workspaceId: file.workspaceId, projectId: file.projectId,
    fileName: file.fileName, byteSize: file.byteSize, folderId: file.folderId,
    destinationPath: file.destinationPath, authorId: file.createdBy, createdAt: file.createdAt,
    available: file.status === "ready", deleted: file.status === "deleted" || file.status === "deleting" };
}
export const importFileApi = {
  async list(http: TmsHttpClient, scope: ImportScope, query: string, cursor: string | null, signal: AbortSignal) {
    const params = new URLSearchParams({ limit: "30", q: query });
    if (cursor) params.set("cursor", cursor);
    const page = await http.get<Api["ImportFileListEnvelope"]>(`${root(scope)}?${params}`, signal);
    return { items: page.data.map(map), nextCursor: page.meta.hasMore ? page.meta.nextCursor : null };
  },
  async get(http: TmsHttpClient, scope: ImportScope, id: string, signal: AbortSignal) {
    return map((await http.getResource<Api["ImportFile"]>(`${root(scope)}/${encodeURIComponent(id)}`, signal)).data);
  },
  async save(http: TmsHttpClient, scope: ImportScope, id: string, folderId: string | null, signal: AbortSignal) {
    const body: Api["ImportFileSaveRequest"] = { folderId };
    return map(await http.mutate<Api["ImportFile"]>(`${root(scope)}/${encodeURIComponent(id)}`, "POST", body, signal));
  },
};

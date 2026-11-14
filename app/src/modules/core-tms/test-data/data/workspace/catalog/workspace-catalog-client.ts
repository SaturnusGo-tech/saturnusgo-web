import type { components, operations } from "../../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WorkspaceDataPort } from "../../../application/ports/workspace-data-port";
import type { WorkspaceDataset } from "../../../model/workspace/data-workspace";
type Api = components["schemas"];
type Listing = operations["listTdmWorkspaceDatasets"]["responses"][200]["content"]["application/json"];
type Port = Pick<WorkspaceDataPort, "datasets" | "dataset" | "saveDataset" | "linkSource" | "unlinkSource" | "saveView" | "archiveDataset">;
function dataset(value: Api["TdmWorkspaceDataset"]): WorkspaceDataset {
  return { id: value.id, name: value.name, description: value.description, status: value.status, revision: value.revision,
    sources: value.sources.map(source => ({ id: source.id, name: source.name, description: source.description, kind: source.kind, status: source.status, revision: source.revision,
      tableName: source.tableName, rowCount: source.rowCount, columns: source.columns.map(column => ({ key: column.key, type: column.type })), createdAt: source.createdAt, updatedAt: source.updatedAt })),
    views: value.views.map(view => ({ id: view.id, name: view.name, query: view.query, revision: view.revision, sourceIds: [...view.sourceIds], createdAt: view.createdAt, updatedAt: view.updatedAt })),
    createdAt: value.createdAt, updatedAt: value.updatedAt };
}
export function createWorkspaceCatalogClient(http: TmsHttpClient, base: string): Port {
  const path = (id: string) => `${base}/dataset-workspaces/${encodeURIComponent(id)}`;
  const headers = (current: WorkspaceDataset, key: string, signal: AbortSignal) => ({ signal, idempotencyKey: key, ifMatch: `"tdm-catalog:${current.id}:${current.revision}"` });
  return {
    async datasets(search, cursor, signal, archived = false, sort = "name") {
      const query = new URLSearchParams({ search, limit: "50", sort, status: archived ? "ARCHIVED" : "ACTIVE" }); if (cursor) query.set("cursor", cursor);
      const page = await http.get<Listing>(`${base}/dataset-workspaces?${query}`, signal); return { items: page.data.map(dataset), cursor: page.page.nextCursor };
    },
    async dataset(id, signal) { return dataset((await http.getResource<Api["TdmWorkspaceDataset"]>(path(id), signal)).data); },
    async saveDataset(value, current, key, signal) {
      const body: Api["TdmWorkspaceDatasetDraft"] = { name: value.name, description: value.description };
      return dataset((await http.mutateResource<Api["TdmWorkspaceDataset"]>(current ? path(current.id) : `${base}/dataset-workspaces`, current ? "PATCH" : "POST", body, current ? headers(current, key, signal) : { signal, idempotencyKey: key })).data);
    },
    async linkSource(current, sourceId, key, signal) { const body: Api["TdmWorkspaceSourceLink"] = { sourceId }; return dataset((await http.mutateResource<Api["TdmWorkspaceDataset"]>(`${path(current.id)}/sources`, "POST", body, headers(current, key, signal))).data); },
    async unlinkSource(current, sourceId, key, signal) { return dataset((await http.mutateResource<Api["TdmWorkspaceDataset"]>(`${path(current.id)}/sources/${encodeURIComponent(sourceId)}/unlink`, "POST", {}, headers(current, key, signal))).data); },
    async saveView(current, value, viewId, key, signal) {
      const body: Api["TdmDatasetViewDraft"] = { name: value.name, sourceIds: [...value.sourceIds], query: value.query };
      return dataset((await http.mutateResource<Api["TdmWorkspaceDataset"]>(`${path(current.id)}/views${viewId ? `/${encodeURIComponent(viewId)}` : ""}`, viewId ? "PATCH" : "POST", body, headers(current, key, signal))).data);
    },
    async archiveDataset(current, restore, key, signal) { return dataset((await http.mutateResource<Api["TdmWorkspaceDataset"]>(`${path(current.id)}/${restore ? "restore" : "archive"}`, "POST", {}, headers(current, key, signal))).data); },
  };
}

import type { components, operations } from "../../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WorkspaceDataPort } from "../../../application/ports/workspace-data-port";
import type { StaticResource } from "../../../model/catalog/static-resource";
type Api = components["schemas"];
type Listing = operations["listTdmStaticResources"]["responses"][200]["content"]["application/json"];
type Port = Pick<WorkspaceDataPort, "staticResources" | "staticResource" | "saveStatic" | "archiveStatic">;
function resource(value: Api["TdmStaticResource"]): StaticResource {
  return { id: value.id, name: value.name, description: value.description, environmentId: value.environmentId, dataType: value.dataType, value: value.value,
    status: value.status, revision: value.revision, currentVersionId: value.currentVersionId, createdAt: value.createdAt, updatedAt: value.updatedAt, warnings: value.warnings.map(warning => ({ code: warning.code })) };
}
export function createStaticResourceClient(http: TmsHttpClient, base: string): Port {
  const path = (id: string) => `${base}/static-resources/${encodeURIComponent(id)}`;
  return {
    async staticResources(search, cursor, signal, archived = false, sort = "name") {
      const query = new URLSearchParams({ search, limit: "50", sort, status: archived ? "ARCHIVED" : "ACTIVE" }); if (cursor) query.set("cursor", cursor);
      const page = await http.get<Listing>(`${base}/static-resources?${query}`, signal); return { items: page.data.map(resource), cursor: page.page.nextCursor };
    },
    async staticResource(id, signal) { return resource((await http.getResource<Api["TdmStaticResource"]>(path(id), signal)).data); },
    async saveStatic(value, current, key, signal) {
      const body: Api["TdmStaticResourceDraft"] = { name: value.name, description: value.description, environmentId: value.environmentId, dataType: value.dataType, value: value.value };
      return resource((await http.mutateResource<Api["TdmStaticResource"]>(current ? path(current.id) : `${base}/static-resources`, current ? "PATCH" : "POST", body, { signal, idempotencyKey: key, ...(current ? { ifMatch: `"tdm-catalog:${current.id}:${current.revision}"` } : {}) })).data);
    },
    async archiveStatic(current, restore, key, signal) { await http.mutateResource(`${path(current.id)}/${restore ? "restore" : "archive"}`, "POST", {}, { signal, idempotencyKey: key, ifMatch: `"tdm-catalog:${current.id}:${current.revision}"` }); },
  };
}

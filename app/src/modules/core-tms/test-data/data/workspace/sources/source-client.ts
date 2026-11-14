import type { components, operations } from "../../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WorkspaceDataPort } from "../../../application/ports/workspace-data-port";
import type { DataSource } from "../../../model/workspace/data-workspace";
type Api = components["schemas"];
type Listing = operations["listTdmSources"]["responses"][200]["content"]["application/json"];
type Port = Pick<WorkspaceDataPort, "sources" | "source" | "connectSource" | "importSource" | "updateSource" | "archiveSource" | "query">;
function source(value: Api["TestDataSource"]): DataSource {
  return { id: value.id, name: value.name, description: value.description, kind: value.kind, status: value.status, revision: value.revision,
    tableName: value.tableName, columns: value.columns.map(column => ({ key: column.key, type: column.type })), rowCount: value.rowCount,
    provenance: value.provenance, ...(value.connection ? { connection: "host" in value.connection ? { host: value.connection.host, port: value.connection.port, database: value.connection.database, username: value.connection.username, tls: value.connection.tls } : { datasetId: value.connection.datasetId, region: value.connection.region } } : {}), createdAt: value.createdAt, updatedAt: value.updatedAt };
}
export function createSourceClient(http: TmsHttpClient, base: string): Port {
  const path = (id: string) => `${base}/sources/${encodeURIComponent(id)}`;
  return {
    async sources(search, cursor, signal, archived = false, sort = "name") {
      const query = new URLSearchParams({ search, limit: "50", sort, status: archived ? "ARCHIVED" : "ACTIVE" }); if (cursor) query.set("cursor", cursor);
      const page = await http.get<Listing>(`${base}/sources?${query}`, signal); return { items: page.data.map(source), cursor: page.page.nextCursor };
    },
    async source(id, signal) { return source((await http.getResource<Api["TestDataSource"]>(path(id), signal)).data); },
    async connectSource(value, key, signal) {
      const body: Api["TestDataSourceCreate"] = value.kind === "POSTMAN" ? { ...value, connection: { ...value.connection } }
        : value.kind === "MYSQL" ? { ...value, kind: "MYSQL", connection: { ...value.connection } } : { ...value, kind: "POSTGRES", connection: { ...value.connection } };
      return source((await http.mutateResource<Api["TestDataSource"]>(`${base}/sources`, "POST", body, { signal, idempotencyKey: key })).data);
    },
    async importSource(value, key, signal) {
      const body: Api["TestDataSourceImport"] = { ...value };
      return source((await http.mutateResource<Api["TestDataSource"]>(`${base}/sources/import`, "POST", body, { signal, idempotencyKey: key })).data);
    },
    async updateSource(current, value, key, signal) {
      const body: Api["TestDataSourcePatch"] = { name: value.name, description: value.description };
      return source((await http.mutateResource<Api["TestDataSource"]>(path(current.id), "PATCH", body, { signal, idempotencyKey: key, ifMatch: `"tdm-source:${current.id}:${current.revision}"` })).data);
    },
    async archiveSource(current, key, signal) { await http.mutateResource(`${path(current.id)}/archive`, "POST", {}, { signal, idempotencyKey: key, ifMatch: `"tdm-source:${current.id}:${current.revision}"` }); },
    async query(value, signal) {
      const body: Api["TestDataSourceQueryRequest"] = { sourceIds: [...value.sourceIds], sql: value.sql, limit: value.limit, offset: value.offset };
      const result = (await http.mutateResource<Api["TestDataSourceQueryResult"]>(`${base}/sources/query`, "POST", body, { signal })).data;
      return { columns: result.columns.map(column => ({ name: column.key, type: column.type })), rows: result.rows.map(row => Object.fromEntries(Object.entries(row).map(([key, cell]) => [key,
        cell === null || typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean" ? cell : JSON.stringify(cell) ?? ""]))),
      rowCount: result.rowCount, hasMore: result.hasMore, limit: result.limit, offset: result.offset, truncated: result.truncated, durationMs: result.durationMs };
    },
  };
}

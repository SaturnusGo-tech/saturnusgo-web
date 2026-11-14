import type { components, operations } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TestDataPort } from "../../application/ports/test-data-port";
import type { Dataset, DatasetDraft, DatasetVersion } from "../../model/resources/resource";
type Api = components["schemas"];
type Listing = operations["listTdmDatasets"]["responses"][200]["content"]["application/json"];
type Versions = operations["listTdmDatasetVersions"]["responses"][200]["content"]["application/json"];
type Usage = operations["listTdmDatasetUsage"]["responses"][200]["content"]["application/json"];
type Port = Pick<TestDataPort, "datasets" | "dataset" | "versions" | "version" | "saveDataset" | "archiveDataset">;
function dataset(value: Api["TdmDataset"]): Dataset {
  return { id: value.id, name: value.name, description: value.description, environmentId: value.environmentId,
    revision: value.revision, currentVersionId: value.currentVersionId, currentVersion: value.currentVersion,
    fieldCount: value.fieldCount, usedIn: value.usedIn, updatedAt: value.updatedAt, archived: value.status === "ARCHIVED" };
}
function version(value: Api["TdmDatasetVersion"]): DatasetVersion {
  return { id: value.id, version: value.version, environmentId: value.environmentId, fields: value.fields.map(field => ({ ...field })), createdAt: value.createdAt };
}
function draft(value: DatasetDraft): Api["TdmDatasetDraft"] {
  return { name: value.name, description: value.description, environmentId: value.environmentId,
    fields: value.fields.map(field => ({ key: field.key, type: field.type, value: field.value, ...(field.description ? { description: field.description } : {}) })) };
}
export function createDatasetClient(http: TmsHttpClient, base: string): Port & { usage(id: string, cursor: string | null, signal: AbortSignal): ReturnType<TestDataPort["usage"]> } {
  const path = (id: string) => `${base}/datasets/${encodeURIComponent(id)}`;
  return {
    async datasets(search, cursor, signal, archived = false, sort = "name") {
      const query = new URLSearchParams({ search, limit: "50", sort, status: archived ? "ARCHIVED" : "ACTIVE" });
      if (cursor) query.set("cursor", cursor);
      const page = await http.get<Listing>(`${base}/datasets?${query}`, signal);
      return { items: page.data.map(dataset), cursor: page.page.nextCursor };
    },
    async dataset(id, signal) { return dataset((await http.getResource<Api["TdmDataset"]>(path(id), signal)).data); },
    async versions(id, cursor, signal) {
      const query = new URLSearchParams({ limit: "50" }); if (cursor) query.set("cursor", cursor);
      const page = await http.get<Versions>(`${path(id)}/versions?${query}`, signal);
      return { items: page.data.map(version), cursor: page.page.nextCursor };
    },
    async version(id, versionId, signal) { return version((await http.getResource<Api["TdmDatasetVersion"]>(`${path(id)}/versions/${encodeURIComponent(versionId)}`, signal)).data); },
    async saveDataset(value, current, key, signal) {
      const response = await http.mutateResource<Api["TdmDataset"]>(current ? `${path(current.id)}/versions` : `${base}/datasets`, "POST", draft(value),
        { signal, idempotencyKey: key, ...(current ? { ifMatch: `"tdm:${current.id}:${current.revision}"` } : {}) });
      return dataset(response.data);
    },
    async archiveDataset(current, restore, key, signal) {
      await http.mutateResource<Api["TdmDataset"]>(`${path(current.id)}/${restore ? "restore" : "archive"}`, "POST", {},
        { signal, idempotencyKey: key, ifMatch: `"tdm:${current.id}:${current.revision}"` });
    },
    async usage(id, cursor, signal) {
      const query = new URLSearchParams({ limit: "50" }); if (cursor) query.set("cursor", cursor);
      const page = await http.get<Usage>(`${path(id)}/usage?${query}`, signal);
      return { items: page.data.map(item => ({ id: item.caseId, key: item.caseKey, title: item.title })), cursor: page.page.nextCursor };
    },
  };
}

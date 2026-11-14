import type { ResourcePage } from "../../model/resources/resource";
import type { StaticResource, StaticResourceDraft } from "../../model/catalog/static-resource";
import type { DataSource, SourceConnectionDraft, SourceImportDraft, SourceQuery, SourceQueryResult, DatasetViewDraft, WorkspaceDataset, WorkspaceDatasetDraft } from "../../model/workspace/data-workspace";
import type { SourceImportFile } from "../../model/source-import/source-import-file";
export interface WorkspaceDataPort {
  readImportFile(file: File, signal: AbortSignal): Promise<SourceImportFile>;
  sources(search: string, cursor: string | null, signal: AbortSignal, archived?: boolean, sort?: "name" | "updatedAt"): Promise<ResourcePage<DataSource>>;
  source(id: string, signal: AbortSignal): Promise<DataSource>;
  connectSource(draft: SourceConnectionDraft, key: string, signal: AbortSignal): Promise<DataSource>;
  importSource(draft: SourceImportDraft, key: string, signal: AbortSignal): Promise<DataSource>;
  updateSource(current: DataSource, value: { name: string; description: string }, key: string, signal: AbortSignal): Promise<DataSource>;
  archiveSource(current: DataSource, key: string, signal: AbortSignal): Promise<void>;
  query(value: SourceQuery, signal: AbortSignal): Promise<SourceQueryResult>;
  datasets(search: string, cursor: string | null, signal: AbortSignal, archived?: boolean, sort?: "name" | "updatedAt"): Promise<ResourcePage<WorkspaceDataset>>;
  dataset(id: string, signal: AbortSignal): Promise<WorkspaceDataset>;
  saveDataset(draft: WorkspaceDatasetDraft, current: WorkspaceDataset | null, key: string, signal: AbortSignal): Promise<WorkspaceDataset>;
  linkSource(current: WorkspaceDataset, sourceId: string, key: string, signal: AbortSignal): Promise<WorkspaceDataset>;
  unlinkSource(current: WorkspaceDataset, sourceId: string, key: string, signal: AbortSignal): Promise<WorkspaceDataset>;
  saveView(current: WorkspaceDataset, draft: DatasetViewDraft, viewId: string | null, key: string, signal: AbortSignal): Promise<WorkspaceDataset>;
  archiveDataset(current: WorkspaceDataset, restore: boolean, key: string, signal: AbortSignal): Promise<WorkspaceDataset>;
  staticResources(search: string, cursor: string | null, signal: AbortSignal, archived?: boolean, sort?: "name" | "updatedAt"): Promise<ResourcePage<StaticResource>>;
  staticResource(id: string, signal: AbortSignal): Promise<StaticResource>;
  saveStatic(draft: StaticResourceDraft, current: StaticResource | null, key: string, signal: AbortSignal): Promise<StaticResource>;
  archiveStatic(current: StaticResource, restore: boolean, key: string, signal: AbortSignal): Promise<void>;
}

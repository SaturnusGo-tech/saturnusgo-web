import { useCallback, useState } from "react";
import { requestAuthoringLeave } from "../../../authoring/leave/application/authoring-leave";
import type { Credential, Dataset } from "../../model/resources/resource";
import type { StaticResource } from "../../model/catalog/static-resource";
import type { DataSource, DatasetView, WorkspaceDataset } from "../../model/workspace/data-workspace";
import { useTestData } from "../context/TestDataContext";
import { useDataCatalog } from "../catalog/useDataCatalog";

type ResourceKind = "datasets" | "credentials" | "static" | "values";
type Selection = { mode: "create"; kind: ResourceKind } | { mode: "static"; resource: StaticResource } |
  { mode: "dataset"; resource: WorkspaceDataset } | { mode: "source"; resource: DataSource; dataset: WorkspaceDataset } |
  { mode: "view"; dataset: WorkspaceDataset; view: DatasetView } | { mode: "read"; resource: Dataset | Credential } | null;
export function useResourceWorkspace() {
  const feature = useTestData();
  const [open, setOpen] = useState({ datasets: true, credentials: false, static: false, values: false });
  const [selection, setSelection] = useState<Selection>(null), [archived, setArchived] = useState(false);
  const [sort, setSort] = useState<"name" | "updatedAt">("name");
  const loadDatasets = useCallback((search: string, cursor: string | null, signal: AbortSignal) =>
    feature!.port.datasets(search, cursor, signal, archived, sort), [feature, archived, sort]);
  const loadCredentials = useCallback((search: string, cursor: string | null, signal: AbortSignal) =>
    feature!.port.credentials(search, cursor, signal, sort), [feature, sort]);
  const loadStatic = useCallback((search: string, cursor: string | null, signal: AbortSignal) =>
    feature!.workspace!.staticResources(search, cursor, signal, archived, sort), [feature, archived, sort]);
  const loadWorkspaces = useCallback((search: string, cursor: string | null, signal: AbortSignal) =>
    feature!.workspace!.datasets(search, cursor, signal, archived, sort), [feature, archived, sort]);
  const datasets = useDataCatalog<Dataset>(feature?.permissions.read && (!feature.workspace || open.values) ? loadDatasets : null);
  const credentials = useDataCatalog<Credential>(feature?.permissions.read && open.credentials ? loadCredentials : null);
  const statics = useDataCatalog<StaticResource>(feature?.permissions.read && feature.workspace && open.static ? loadStatic : null);
  const workspaces = useDataCatalog<WorkspaceDataset>(feature?.permissions.read && feature.workspace && open.datasets ? loadWorkspaces : null);
  function search(value: string) { datasets.setSearch(value); credentials.setSearch(value); statics.setSearch(value); workspaces.setSearch(value); }
  const choose = (next: Selection) => void requestAuthoringLeave(() => setSelection(next));
  function create(kind: ResourceKind) { choose({ mode: "create", kind }); setOpen(current => ({ ...current, [kind]: true })); }
  function refresh() { datasets.refresh(); credentials.refresh(); statics.refresh(); workspaces.refresh(); }
  function saved(resource: Dataset | Credential) { refresh(); setSelection({ mode: "read", resource }); }
  function savedStatic(resource: StaticResource) { refresh(); setSelection({ mode: "static", resource }); }
  function savedDataset(resource: WorkspaceDataset) {
    refresh(); setSelection(previous => previous?.mode === "view" ? { ...previous, dataset: resource, view: resource.views.find(view => view.id === previous.view.id) ?? previous.view } : { mode: "dataset", resource });
  }
  function updated() { refresh(); setSelection(null); }
  return { feature, open, selection, archived, setArchived, sort, setSort, datasets, credentials, statics, workspaces, search, create,
    toggle: (kind: ResourceKind) => setOpen(current => ({ ...current, [kind]: !current[kind] })),
    select: (resource: Dataset | Credential) => choose({ mode: "read", resource }),
    selectStatic: (resource: StaticResource) => choose({ mode: "static", resource }),
    selectDataset: (resource: WorkspaceDataset) => choose({ mode: "dataset", resource }),
    selectSource: (dataset: WorkspaceDataset, resource: DataSource) => choose({ mode: "source", dataset, resource }),
    selectView: (dataset: WorkspaceDataset, view: DatasetView) => choose({ mode: "view", dataset, view }),
    close: () => choose(null), saved, savedStatic, savedDataset, updated };
}

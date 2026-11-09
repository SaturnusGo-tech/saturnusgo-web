import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { SelectionTree } from "../../../cases/selection/tree/SelectionTree";
import { WorkspaceBreadcrumbs } from "../../../common/breadcrumbs/WorkspaceBreadcrumbs";
import { DetailResults, DetailState } from "../DetailPage";
import { useDrillCaseCatalog } from "../../../../dashboards/state/case-catalog/useDrillCaseCatalog";
import styles from "./case-tree.module.css";

export function DrillCaseTree({ rows, workspaceId, selection, onSelection, onOpenRow }: {
  rows: DashboardDrillRow[]; workspaceId: string; selection?: Set<string>;
  onSelection: (selection: Set<string>) => void; onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const projectIds = [...new Set(rows.map((row) => row.projectId))];
  const state = useDrillCaseCatalog(workspaceId, projectIds);
  if (!rows.length) return null;
  const missing = rows.some((row) => {
    const catalog = state.catalog[row.projectId];
    const item = catalog?.cases.find((item) => item.id === row.id);
    return !item || (item.folderId ? !catalog.folders.some((folder) => folder.id === item.folderId)
      : item.folderPath !== "/" && !catalog.folders.some((folder) => folder.path === item.folderPath));
  });
  const selected = selection ?? new Set<string>();
  const scope = (ids: readonly string[]) => {
    const next = new Set(selected); const remove = ids.every((id) => next.has(id));
    ids.forEach((id) => remove ? next.delete(id) : next.add(id)); onSelection(next);
  };
  return <DetailResults loading={state.loading} pending={state.loading}>
    {state.error || missing
      ? <DetailState empty={false} error={ru ? "Не удалось загрузить расположение тест-кейсов." : "Could not load test-case locations."} onRetry={state.retry} />
      : projectIds.map((projectId) => {
    const projectRows = rows.filter((row) => row.projectId === projectId);
    const catalog = state.catalog[projectId];
    const byId = new Map(catalog.cases.map((item) => [item.id, item]));
    const foldersById = new Map(catalog.folders.map(folder => [folder.id, folder]));
    const foldersByPath = new Map<string, RepositoryFolder>();
    for (const folder of catalog.folders) {
      if (!foldersByPath.has(folder.path) || !folder.archivedAt) foldersByPath.set(folder.path, folder);
    }
    return <SelectionTree key={projectId} cases={projectRows.map((row) => byId.get(row.id)!)} folders={catalog.folders}
      selected={selected} selectable={Boolean(selection)} includeArchived preserveCaseOrder titleMode="inline" hideRedundantRootCount ru={ru}
      trailing={item => {
        let folder = item.folderId ? foldersById.get(item.folderId) : foldersByPath.get(item.folderPath);
        const items = [];
        const visited = new Set<string>();
        while (folder && !visited.has(folder.id)) {
          visited.add(folder.id);
          items.push({ id: folder.id, label: folder.name });
          folder = folder.parentId ? foldersById.get(folder.parentId) : undefined;
        }
        return items.length > 0 && <div className={styles.breadcrumb} data-testid="drill-case-folder-path">
          <WorkspaceBreadcrumbs label={`${ru ? "Путь к папке" : "Folder path"} · ${item.key}`} items={items.reverse()} />
        </div>;
      }}
      onToggle={(id) => scope([id])} onScope={scope}
      onOpen={(item) => { const row = projectRows.find((row) => row.id === item.id); if (row) onOpenRow(row); }}
      heading={<><strong>{projectRows[0].project}</strong><span>{projectRows.length}</span></>} />;
  })}</DetailResults>;
}

import { Folder } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { SelectionTree } from "../../../cases/selection/tree/SelectionTree";
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
    return <SelectionTree key={projectId} cases={projectRows.map((row) => byId.get(row.id)!)} folders={catalog.folders}
      selected={selected} selectable={Boolean(selection)} includeArchived preserveCaseOrder titleMode="inline" hideRedundantRootCount ru={ru}
      trailing={item => {
        const path = (item.folderId ? foldersById.get(item.folderId)?.path : item.folderPath) ?? item.folderPath;
        const breadcrumb = path.split("/").filter(Boolean).join(" / ");
        return breadcrumb && <span className={styles.breadcrumb} title={breadcrumb}><Folder size={13} aria-hidden="true" /><span>{breadcrumb}</span></span>;
      }}
      onToggle={(id) => scope([id])} onScope={scope}
      onOpen={(item) => { const row = projectRows.find((row) => row.id === item.id); if (row) onOpenRow(row); }}
      heading={<><strong>{projectRows[0].project}</strong><span>{projectRows.length}</span></>} />;
  })}</DetailResults>;
}

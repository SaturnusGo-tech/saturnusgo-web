import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { SelectionTree } from "../../../cases/selection/tree/SelectionTree";
import { RunCasesSkeleton } from "../../../runs/loading/RunCasesSkeleton";
import { DetailState } from "../DetailPage";
import { useDrillCaseCatalog } from "../../../../dashboards/state/case-catalog/useDrillCaseCatalog";

export function DrillCaseTree({ rows, workspaceId, selection, onSelection, onOpenRow }: {
  rows: DashboardDrillRow[]; workspaceId: string; selection?: Set<string>;
  onSelection: (selection: Set<string>) => void; onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const projectIds = [...new Set(rows.map((row) => row.projectId))];
  const state = useDrillCaseCatalog(workspaceId, projectIds);
  if (!rows.length) return null;
  if (state.loading) return <RunCasesSkeleton />;
  const missing = rows.some((row) => {
    const catalog = state.catalog[row.projectId];
    const item = catalog?.cases.find((item) => item.id === row.id);
    return !item || (item.folderId ? !catalog.folders.some((folder) => folder.id === item.folderId)
      : item.folderPath !== "/" && !catalog.folders.some((folder) => folder.path === item.folderPath));
  });
  if (state.error || missing) return <DetailState loading={false} empty={false} error={ru ? "Не удалось загрузить расположение тест-кейсов." : "Could not load test-case locations."} onRetry={state.retry} />;
  const selected = selection ?? new Set<string>();
  const scope = (ids: readonly string[]) => {
    const next = new Set(selected); const remove = ids.every((id) => next.has(id));
    ids.forEach((id) => remove ? next.delete(id) : next.add(id)); onSelection(next);
  };
  return <>{projectIds.map((projectId) => {
    const projectRows = rows.filter((row) => row.projectId === projectId);
    const catalog = state.catalog[projectId];
    const byId = new Map(catalog.cases.map((item) => [item.id, item]));
    return <SelectionTree key={projectId} cases={projectRows.map((row) => byId.get(row.id)!)} folders={catalog.folders}
      selected={selected} selectable={Boolean(selection)} includeArchived preserveCaseOrder ru={ru}
      onToggle={(id) => scope([id])} onScope={scope}
      onOpen={(item) => { const row = projectRows.find((row) => row.id === item.id); if (row) onOpenRow(row); }}
      heading={<><strong>{projectRows[0].project}</strong><span>{projectRows.length}</span></>} />;
  })}</>;
}

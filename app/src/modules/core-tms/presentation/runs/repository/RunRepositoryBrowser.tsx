import { useRunFolderAppearance } from "../../../folders/state/appearance-catalog/useRunFolderAppearance";
import type { RunRepositoryModel } from "./state/useRunRepository";
import { isWorkingRun } from "../../../runs/model/history/run-history";
import { RunIncompleteDialog } from "../completion/RunIncompleteDialog";
import { RunCasesSkeleton } from "../loading/RunCasesSkeleton";
import { RunAssignmentTools } from "../assignment/RunAssignmentTools";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { runRepositoryFolders } from "../../../runs/batches/model/repository/run-repository";
import { Button } from "@heroui/react";
import { useCallback, useState } from "react";
import { RepositoryQueryControls } from "../../cases/browser/controls/RepositoryQueryControls";
import { SelectionTree } from "../../cases/selection/tree/SelectionTree";
import { RunRepositoryHeader } from "./header/RunRepositoryHeader";
import { FormError } from "../../common/error/FormError";
import { statusIcon } from "../../status/executionStatus";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import css from "./run-repository.module.css";
import selection from "../../cases/browser/selection/repository-selection.module.css";

export function RunRepositoryBrowser({ model, repository, onSelectItem, onEditRun, draftDirty = false, lifecycleBlocked = false, startBlocked = false, fixedRun = false }: { model: WorkspaceModel; repository: RunRepositoryModel; onSelectItem: (id: string) => void; onEditRun?: () => void; draftDirty?: boolean; lifecycleBlocked?: boolean; startBlocked?: boolean; fixedRun?: boolean }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPortal, setFilterPortal] = useState<HTMLElement>();
  // The enclosing documentation drawer hides portals mounted outside its dialog.
  const captureRepository = useCallback((node: HTMLElement | null) => {
    if (fixedRun && node) setFilterPortal(node.closest<HTMLElement>('[role="dialog"]') ?? undefined);
  }, [fixedRun]);
  const { browser, rows, run, assignments, runFilters, cases, filters, visible, groups, lookup } = repository;
  const navigationLocked = browser.busy || assignments.busy || lifecycleBlocked;
  const controlsLocked = navigationLocked || !browser.ready || browser.loading || Boolean(browser.error);
  const choose = (runId: string, projectId: string) => {
    if (navigationLocked) return;
    model.setProjectId(projectId); model.setSelectedRunId(runId); model.setSelectedRunItemId(null);
  };
  const canManage = model.connection === "connected" && model.data.meta.authorization.capabilities.includes("run:manage");
  const canAssign = canManage && Boolean(run && !run.archivedAt && ["draft","active","paused"].includes(run.status));
  const activeChoice = browser.batch?.id ?? model.selectedRun?.id ?? "";
  const folderCatalog = useRunFolderAppearance(groups.flatMap(group => group.cases.map(item => item.projectId)));
  const selectionToggle = canAssign && <Button type="button" size="sm" variant="light" disableRipple className={css.selectionToggle}
    isDisabled={controlsLocked} aria-pressed={assignments.selecting} aria-label={ru ? "Выбрать тест-кейсы" : "Select test cases"}
    onPress={assignments.toggleSelection}>{assignments.selecting ? (ru ? "Готово" : "Done") : (ru ? "Выбрать" : "Select")}</Button>;
  return <aside ref={captureRepository} className={css.browser} aria-label={ru ? "Кейсы прогона" : "Run repository"}>
    <RunRepositoryHeader onEdit={canManage && !draftDirty && !controlsLocked ? onEditRun : undefined} ru={ru} run={run} choices={browser.choices} value={activeChoice} canManage={canManage} fixedRun={fixedRun}
      disabled={navigationLocked} actionsDisabled={controlsLocked} startBlocked={startBlocked || controlsLocked}
      onCreate={()=>model.openRunDialog()} onAction={action=>void browser.act(action)}
      onChoose={id=>{const runs=browser.choices.find(c=>c.id===id)?.runs;const next=runs?.find(isWorkingRun)??runs?.[0];if(next)choose(next.id,next.projectId);}}/>
    <RepositoryQueryControls disabled={controlsLocked} compact customSectionsOnly locale={locale}
      query={filters.query} onQuery={filters.setQuery} qlQuery={filters.qlQuery} onQlQuery={filters.setQlQuery}
      filters={filters.filters} onFilters={filters.setFilters} facets={filters.facets} onFacets={filters.setFacets}
      options={filters.options} tags={filters.options.tags} directory={filters.directory}
      filterOpen={filterOpen} onFilterOpen={setFilterOpen} layer={fixedRun ? 180 : undefined} portalContainer={filterPortal}
      extraSections={runFilters.sections} onResetExtra={runFilters.reset} />
    {assignments.error && <FormError message={assignments.error} />}
    {browser.incomplete && <RunIncompleteDialog ru={ru} busy={controlsLocked} canArchive={model.canArchiveRun}
      onClose={browser.dismissIncomplete} onArchive={() => void browser.act("archive")} />}
    {draftDirty && <p role="status">{ru ? "Сохраните результат шага перед изменением прогона." : "Save the step result before changing the run."}</p>}
    {run?.archivedAt && (!fixedRun || !run.batchId) && model.canArchiveRun && <button type="button" className={css.restore} disabled={controlsLocked} onClick={() => void browser.act("restore")}>{ru ? "Вернуть из архива" : "Restore from archive"}</button>}
    {browser.error && <FormError message={browser.error} />}
    <div className={css.scroll} aria-busy={browser.loading}>
      {browser.loading && groups.length === 0 && <RunCasesSkeleton />}
      {groups.map(({ id: key, label, cases: entries }, index) => {
        const projectId = `group:${key}`;
        const scoped = entries;
        return <SelectionTree titleMode="marquee" key={key} includeArchived={filters.filters.includeArchived} cases={scoped} folders={runRepositoryFolders(model.data.workspace.id, projectId, scoped, folderCatalog)} selected={assignments.selected} selectable={canAssign && assignments.selecting} disabled={controlsLocked}
          ru={ru} onScope={assignments.toggleScope} onToggle={assignments.toggle} activeId={model.selectedRunItemId ?? undefined}
          heading={<><strong className={css.projectName}><span title={label}>{label}</span><small>{entries.length}</small></strong>
            {canAssign && <div className={selection.commands} role="group" aria-label={ru ? "Выбор тест-кейсов" : "Case selection"}
              data-open={assignments.selecting || undefined} aria-hidden={!assignments.selecting}
              ref={element => { if (element) element.inert = !assignments.selecting; }}>
              <button type="button" disabled={!assignments.selecting || controlsLocked}
                onClick={() => assignments.toggleScope(entries.map(item => item.id))}>{ru ? "Выбрать все" : "Select all"}</button>
            </div>}{index === 0 && selectionToggle}</>}
          trailing={(item) => <span className={css.assignee}><ResponsibleName workspaceId={model.data.workspace.id}
            identityId={lookup.get(item.id)?.item.assigneeIdentityId ?? null} offline={model.connection !== "connected"} /></span>}
          accessory={(item) => <span title={localizedLabel(locale, lookup.get(item.id)?.item.status ?? "not_run")} className={css.status} data-status={lookup.get(item.id)?.item.status}>{statusIcon[lookup.get(item.id)?.item.status ?? "not_run"]}</span>}
          onOpen={(item) => onSelectItem(item.id)} />;
      })}
      {!browser.loading && groups.length === 0 && assignments.selecting && <div className={css.selectionFallback}>{selectionToggle}</div>}
      {!browser.loading && !visible.length && <p className={css.empty}>{run ? (ru ? "Нет подходящих кейсов" : "No matching cases") : (ru ? "Выберите или создайте прогон" : "Choose or create a run")}</p>}
    </div>
    <RunAssignmentTools state={assignments} workspaceId={model.data.workspace.id} ru={ru} allowed={canAssign}
      paths={[...new Set(cases.map(c=>c.folderPath))]} archived={rows.some(row=>assignments.selected.has(row.item.id)&&row.item.archivedAt)}
      disabled={controlsLocked}/>
  </aside>;
}

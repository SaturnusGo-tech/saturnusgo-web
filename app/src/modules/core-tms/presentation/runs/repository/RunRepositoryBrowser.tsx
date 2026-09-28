import type { RunRepositoryModel } from "./state/useRunRepository";
import { isWorkingRun } from "../../../runs/model/history/run-history";
import { RunIncompleteDialog } from "../completion/RunIncompleteDialog";
import { RunCasesSkeleton } from "../loading/RunCasesSkeleton";
import { RunAssignmentTools } from "../assignment/RunAssignmentTools";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { runRepositoryFolders } from "../../../runs/batches/model/repository/run-repository";
import { SelectionControls } from "../../cases/selection/controls/SelectionControls";
import { SelectionTree } from "../../cases/selection/tree/SelectionTree";
import { RunRepositoryHeader } from "./header/RunRepositoryHeader";
import { FormError } from "../../common/error/FormError";
import { statusIcon } from "../../status/executionStatus";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import css from "./run-repository.module.css";
import controls from "../../cases/browser/controls/repository-controls.module.css";
import selection from "../../cases/browser/selection/repository-selection.module.css";

export function RunRepositoryBrowser({ model, repository, onEditRun, draftDirty = false, lifecycleBlocked = false, startBlocked = false }: { model: WorkspaceModel; repository: RunRepositoryModel; onEditRun?: () => void; draftDirty?: boolean; lifecycleBlocked?: boolean; startBlocked?: boolean }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const { browser, rows, run, assignments, runFilters, cases, filters, visible, groups, lookup } = repository;
  const choose = (runId: string, projectId: string, itemId: string | null = null) => {
    model.setProjectId(projectId); model.setSelectedRunId(runId); model.setSelectedRunItemId(itemId);
  };
  const canManage = model.connection === "connected" && model.data.meta.authorization.capabilities.includes("run:manage");
  const canAssign = canManage && Boolean(run && !run.archivedAt && ["draft","active","paused"].includes(run.status));
  const activeChoice = browser.batch?.id ?? model.selectedRun?.id ?? "";
  return <aside className={css.browser} aria-label={ru ? "Кейсы прогона" : "Run repository"}>
    <RunRepositoryHeader onEdit={canManage && !draftDirty && !lifecycleBlocked && !browser.loading ? onEditRun : undefined} ru={ru} run={run} choices={browser.choices} value={activeChoice} canManage={canManage}
      disabled={browser.busy || assignments.busy || lifecycleBlocked} startBlocked={startBlocked || browser.loading}
      onCreate={()=>model.openRunDialog()} onAction={action=>void browser.act(action)}
      onChoose={id=>{const runs=browser.choices.find(c=>c.id===id)?.runs;const next=runs?.find(isWorkingRun)??runs?.[0];if(next)choose(next.id,next.projectId);}}/>
    <SelectionControls disabled={lifecycleBlocked} inline repository state={filters} ru={ru} extraSections={runFilters.sections} onResetExtra={runFilters.reset}
      action={canAssign && <button type="button" className={`${controls.tool} ${controls.select}`}
        disabled={browser.loading || browser.busy || assignments.busy || lifecycleBlocked} aria-pressed={assignments.selecting}
        aria-label={ru ? "Выбрать тест-кейсы" : "Select test cases"} onClick={assignments.toggleSelection}>
        <span>{assignments.selecting ? (ru ? "Готово" : "Done") : (ru ? "Выбрать" : "Select")}</span></button>}/>
    {assignments.error && <FormError message={assignments.error} />}
    {browser.incomplete && <RunIncompleteDialog ru={ru} busy={browser.busy} canArchive={model.canArchiveRun}
      onClose={browser.dismissIncomplete} onArchive={() => void browser.act("archive")} />}
    {draftDirty && <p role="status">{ru ? "Сохраните результат шага перед изменением прогона." : "Save the step result before changing the run."}</p>}
    {run?.archivedAt && model.canArchiveRun && <button type="button" className={css.restore} disabled={browser.busy} onClick={() => void browser.act("restore")}>{ru ? "Вернуть из архива" : "Restore from archive"}</button>}
    {browser.error && <FormError message={browser.error} />}
    <div className={css.scroll} aria-busy={browser.loading}>
      {browser.loading && <RunCasesSkeleton />}
      {!browser.loading && groups.map(({ id: key, label, cases: entries }) => {
        const projectId = `group:${key}`;
        const scoped = entries;
        return <SelectionTree key={key} includeArchived={filters.filters.includeArchived} cases={scoped} folders={runRepositoryFolders(model.data.workspace.id, projectId, scoped)} selected={assignments.selected} selectable={canAssign && assignments.selecting} disabled={assignments.busy || browser.busy || lifecycleBlocked}
          ru={ru} onScope={assignments.toggleScope} onToggle={assignments.toggle} activeId={model.selectedRunItem?.id}
          heading={<><strong className={css.projectName}><span title={label}>{label}</span><small>{entries.length}</small></strong>
            {canAssign && <div className={selection.commands} role="group" aria-label={ru ? "Выбор тест-кейсов" : "Case selection"}
              data-open={assignments.selecting || undefined} aria-hidden={!assignments.selecting}
              ref={element => { if (element) element.inert = !assignments.selecting; }}>
              <button type="button" disabled={!assignments.selecting || browser.loading || browser.busy || assignments.busy || lifecycleBlocked}
                onClick={() => assignments.toggleScope(entries.map(item => item.id))}>{ru ? "Выбрать все" : "Select all"}</button>
            </div>}</>}
          trailing={(item) => <span className={css.assignee}><ResponsibleName workspaceId={model.data.workspace.id}
            identityId={lookup.get(item.id)?.item.assigneeIdentityId ?? null} offline={model.connection !== "connected"} /></span>}
          accessory={(item) => <span title={localizedLabel(locale, lookup.get(item.id)?.item.status ?? "not_run")} className={css.status} data-status={lookup.get(item.id)?.item.status}>{statusIcon[lookup.get(item.id)?.item.status ?? "not_run"]}</span>}
          onOpen={(item) => { const entry = lookup.get(item.id); if (entry) choose(entry.runId, entry.projectId, entry.item.id); }} />;
      })}
      {!browser.loading && !visible.length && <p className={css.empty}>{run ? (ru ? "Нет подходящих кейсов" : "No matching cases") : (ru ? "Выберите или создайте прогон" : "Choose or create a run")}</p>}
    </div>
    <RunAssignmentTools state={assignments} workspaceId={model.data.workspace.id} ru={ru} allowed={canAssign}
      paths={[...new Set(cases.map(c=>c.folderPath))]} archived={rows.some(row=>assignments.selected.has(row.item.id)&&row.item.archivedAt)}
      disabled={browser.loading || browser.busy || lifecycleBlocked}/>
  </aside>;
}

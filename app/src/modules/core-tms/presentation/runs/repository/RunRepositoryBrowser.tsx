import { RunIncompleteDialog } from "../completion/RunIncompleteDialog";
import { RunCasesSkeleton } from "../loading/RunCasesSkeleton";
import { RunAssignmentTools } from "../assignment/RunAssignmentTools";
import { useRunAssignments } from "../../../runs/assignment/state/useRunAssignments";
import { Check, CheckSquare, Pause, Play, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { useRunBrowser } from "../../../runs/batches/state/browser/useRunBrowser";
import { runRepositoryFolders } from "../../../runs/batches/model/repository/run-repository";
import { SelectionControls, useSelectionFilters } from "../../cases/selection/controls/SelectionControls";
import { SelectionTree } from "../../cases/selection/tree/SelectionTree";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { FormError } from "../../common/error/FormError";
import { statusIcon } from "../../status/executionStatus";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { useRunFilterSections } from "../filters/useRunFilterSections";
import css from "./run-repository.module.css";

export function RunRepositoryBrowser({ model, lifecycleBlocked = false, startBlocked = false }: { model: WorkspaceModel; lifecycleBlocked?: boolean; startBlocked?: boolean }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [runQuery, setRunQuery] = useState("");
  const browser = useRunBrowser({ workspaceId: model.data.workspace.id, selected: model.selectedRun,
    knownRuns: model.data.runs, connected: model.connection === "connected", ru,
    onUpdate: (runs) => model.setData((current) => ({ ...current,
      runs: [...current.runs.filter((r) => !runs.some((next) => r.id === next.id)), ...runs] })),
    onRefreshSelected: model.retryRunResource });
  const rows = useMemo(() => browser.entries.map((entry) => ({ ...entry,
    item: entry.runId === model.selectedRun?.id ? model.runItems.find((item) => item.id === entry.item.id) ?? entry.item : entry.item })),
  [browser.entries, model.runItems, model.selectedRun?.id]);
  const run = browser.selectedRuns[0];
  const assignments = useRunAssignments({ workspaceId:model.data.workspace.id,scope:run?.batchId ?? run?.id ?? "",
    runId:run?.id ?? "",rows,ru,onChanged:() => { browser.refresh();model.retryRunResource(); } });
  const runFilters = useRunFilterSections({ workspaceId: model.data.workspace.id, ru, offline: model.connection !== "connected",
    projects: model.data.projects.filter((project) => rows.some((entry) => entry.projectId === project.id)),
    owner: assignments.owner, setOwner: assignments.setOwner });
  const cases = useMemo(() => rows.map((entry) => entry.testCase), [rows]);
  const filters = useSelectionFilters(cases);
  const lookup = new Map(rows.map((entry) => [entry.item.id, entry]));
  const visible = filters.visible.filter((item) => { const row = lookup.get(item.id); return row && runFilters.matches(row); });
  const { group } = runFilters;
  const groups = new Map<string, typeof cases>();
  for (const c of visible) {
    const keys = group === "component" ? [c.component || (ru ? "Без компонента" : "No component")]
      : group === "tag" ? (c.tags.length ? c.tags : [ru ? "Без тегов" : "No tags"]) : [c.projectId];
    for (const key of keys) groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const choose = (runId: string, projectId: string, itemId: string | null = null) => {
    model.setProjectId(projectId); model.setSelectedRunId(runId); model.setSelectedRunItemId(itemId);
  };
  const canManage = model.connection === "connected" && model.data.meta.authorization.capabilities.includes("run:manage");
  const canAssign = canManage && Boolean(run && !run.archivedAt && ["draft","active","paused"].includes(run.status));
  const choices = browser.choices.filter((choice) => !runQuery.trim() || `${choice.name} ${choice.tags.join(" ")} ${choice.runs.map((r) => model.data.projects.find((p) => p.id === r.projectId)?.name ?? "").join(" ")}`.toLowerCase().includes(runQuery.trim().toLowerCase()));
  const activeChoice = browser.batch?.id ?? model.selectedRun?.id ?? "";
  const active = browser.choices.find((c) => c.id === activeChoice);
  const available = active && !choices.some((c) => c.id === active.id) ? [active, ...choices] : choices;
  return <aside className={css.browser} aria-label={ru ? "Кейсы прогона" : "Run repository"}>
    <SelectionControls state={filters} ru={ru} extraSections={runFilters.sections} onResetExtra={runFilters.reset}
      onSelectAll={assignments.selecting && canAssign && !assignments.busy ? () => assignments.toggleScope(visible.map((c) => c.id)) : undefined}
      tools={<button type="button" className={css.refresh} aria-label={ru ? "Обновить" : "Refresh"} onClick={browser.refresh} disabled={browser.loading || browser.busy}><RefreshCw size={14} /></button>}
      action={canManage ? <>
        <button type="button" className={css.newRun} onClick={() => model.openRunDialog()}><Plus size={14} />{ru ? "Новый прогон" : "New run"}</button>
        {run && !run.archivedAt && ["draft", "paused", "active"].includes(run.status) && <button type="button" className={css.play}
          aria-label={run.status === "active" ? (ru ? "Приостановить прогон" : "Pause run") : run.status === "paused" ? (ru ? "Продолжить прогон" : "Resume run") : (ru ? "Запустить прогон" : "Start run")}
          title={run.status === "active" ? (ru ? "Пауза" : "Pause") : run.status === "paused" ? (ru ? "Продолжить" : "Resume") : (ru ? "Запустить" : "Start")}
          disabled={browser.loading || browser.busy || assignments.busy || lifecycleBlocked || (run.status !== "active" && startBlocked)}
          onClick={() => void browser.act(run.status === "active" ? "pause" : run.status === "paused" ? "resume" : "start")}>{run.status === "active" ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}</button>}
      </> : undefined} />
    <div className={css.runSelection}>
      <input aria-label={ru ? "Найти прогон или тег" : "Find run or tag"} placeholder={ru ? "Найти прогон или тег" : "Find run or tag"} value={runQuery} onChange={(e) => setRunQuery(e.target.value)} />
      <AnimatedSelect compact label={ru ? "Прогон" : "Run"} value={activeChoice}
        options={[{ value: "", label: ru ? "Выберите прогон" : "Choose a run" }, ...available.map((c) => ({ value: c.id,
          label: `${c.name}${c.runs[0]?.archivedAt ? (ru ? " (архив)" : " (archived)") : ""} · ${c.runs[0]?.status === "paused" ? (ru ? "Пауза" : "Paused") : localizedLabel(locale, c.runs[0]?.status ?? "draft")}` }))]}
        onChange={(id) => { const choice = browser.choices.find((c) => c.id === id); const next = choice?.runs[0]; if (next) choose(next.id, next.projectId); }} />
    </div>
    {run && canManage && !run.archivedAt && (run.status === "active" || run.status === "paused") && <div className={css.lifecycle}>
      <button type="button" disabled={browser.loading || browser.busy || assignments.busy || lifecycleBlocked} onClick={() => void browser.act("complete")}><Check size={14} />{ru ? "Завершить" : "Complete"}</button>
    </div>}
    <RunAssignmentTools state={assignments} workspaceId={model.data.workspace.id} ru={ru} allowed={canAssign}
      disabled={browser.loading || browser.busy || lifecycleBlocked} />
    {assignments.error && <FormError message={assignments.error} />}
    {browser.incomplete && <RunIncompleteDialog ru={ru} busy={browser.busy} canArchive={model.canArchiveRun}
      onClose={browser.dismissIncomplete} onArchive={() => void browser.act("archive")} />}
    {lifecycleBlocked && <p role="status">{ru ? "Сохраните результат шага перед изменением прогона." : "Save the step result before changing the run."}</p>}
    {run?.archivedAt && model.canArchiveRun && <button type="button" className={css.restore} disabled={browser.busy} onClick={() => void browser.act("restore")}>{ru ? "Вернуть из архива" : "Restore from archive"}</button>}
    {browser.error && <FormError message={browser.error} />}
    <div className={css.scroll} aria-busy={browser.loading}>
      {browser.loading && <RunCasesSkeleton />}
      {!browser.loading && [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([key, entries]) => {
        const projectId = group === "project" ? key : `group:${key}`;
        const scoped = group === "project" ? entries : entries.map((c) => ({ ...c, folderPath: "/", folderId: null }));
        return <SelectionTree key={key} cases={scoped} folders={runRepositoryFolders(model.data.workspace.id, projectId, scoped)} selected={assignments.selected} selectable={canAssign && assignments.selecting} disabled={assignments.busy || browser.busy || lifecycleBlocked}
          ru={ru} onScope={assignments.toggleScope} onToggle={assignments.toggle} activeId={model.selectedRunItem?.id}
          heading={<><strong>{group === "project" ? model.data.projects.find((p) => p.id === key)?.name ?? key : key}</strong><span>{entries.length}</span>{canAssign && <button type="button" className={css.selectCases} disabled={browser.loading || browser.busy || assignments.busy || lifecycleBlocked}
            aria-pressed={assignments.selecting} onClick={assignments.toggleSelection}><CheckSquare size={13} />{assignments.selecting ? (ru ? "Снять выбор" : "Clear selection") : (ru ? "Выбрать тест-кейсы" : "Select test cases")}</button>}</>}
          trailing={(item) => <span className={css.assignee}><ResponsibleName workspaceId={model.data.workspace.id}
            identityId={lookup.get(item.id)?.item.assigneeIdentityId ?? null} offline={model.connection !== "connected"} /></span>}
          accessory={(item) => <span title={localizedLabel(locale, lookup.get(item.id)?.item.status ?? "not_run")} className={css.status} data-status={lookup.get(item.id)?.item.status}>{statusIcon[lookup.get(item.id)?.item.status ?? "not_run"]}</span>}
          onOpen={(item) => { const entry = lookup.get(item.id); if (entry) choose(entry.runId, entry.projectId, entry.item.id); }} />;
      })}
      {!browser.loading && !visible.length && <p className={css.empty}>{run ? (ru ? "Нет подходящих кейсов" : "No matching cases") : (ru ? "Выберите или создайте прогон" : "Choose or create a run")}</p>}
    </div>
  </aside>;
}

import { Check, Pause, Play, Plus, RefreshCw } from "lucide-react";
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
import { RunClock } from "../clock/RunClock";
import css from "./run-repository.module.css";

export function RunRepositoryBrowser({ model, lifecycleBlocked = false, startBlocked = false }: { model: WorkspaceModel; lifecycleBlocked?: boolean; startBlocked?: boolean }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [status, setStatus] = useState("all"); const [group, setGroup] = useState("project");
  const [runQuery, setRunQuery] = useState("");
  const browser = useRunBrowser({ workspaceId: model.data.workspace.id, selected: model.selectedRun,
    knownRuns: model.data.runs, connected: model.connection === "connected", ru,
    onUpdate: (runs) => model.setData((current) => ({ ...current,
      runs: [...current.runs.filter((r) => !runs.some((next) => r.id === next.id)), ...runs] })),
    onRefreshSelected: model.retryRunResource });
  const rows = useMemo(() => browser.entries.map((entry) => ({ ...entry,
    item: entry.runId === model.selectedRun?.id ? model.runItems.find((item) => item.id === entry.item.id) ?? entry.item : entry.item })),
  [browser.entries, model.runItems, model.selectedRun?.id]);
  const cases = useMemo(() => rows.filter((e) => status === "all" || e.item.status === status).map((e) => e.testCase), [rows, status]);
  const filters = useSelectionFilters(cases);
  const lookup = new Map(rows.map((entry) => [entry.item.id, entry]));
  const groups = new Map<string, typeof cases>();
  for (const c of filters.visible) {
    const keys = group === "component" ? [c.component || (ru ? "Без компонента" : "No component")]
      : group === "tag" ? (c.tags.length ? c.tags : [ru ? "Без тегов" : "No tags"]) : [c.projectId];
    for (const key of keys) groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const choose = (runId: string, projectId: string, itemId: string | null = null) => {
    model.setProjectId(projectId); model.setSelectedRunId(runId); model.setSelectedRunItemId(itemId);
  };
  const canManage = model.connection === "connected" && model.data.meta.authorization.capabilities.includes("run:manage");
  const run = browser.selectedRuns[0];
  const choices = browser.choices.filter((choice) => !runQuery.trim() || `${choice.name} ${choice.tags.join(" ")} ${choice.runs.map((r) => model.data.projects.find((p) => p.id === r.projectId)?.name ?? "").join(" ")}`.toLowerCase().includes(runQuery.trim().toLowerCase()));
  const activeChoice = browser.batch?.id ?? model.selectedRun?.id ?? "";
  const active = browser.choices.find((c) => c.id === activeChoice);
  const available = active && !choices.some((c) => c.id === active.id) ? [active, ...choices] : choices;
  return <aside className={css.browser} aria-label={ru ? "Кейсы прогона" : "Run repository"}>
    <SelectionControls state={filters} ru={ru} action={canManage ? <button type="button" className={css.newRun} onClick={() => model.openRunDialog()}><Plus size={14} />{ru ? "Новый прогон" : "New run"}</button> : undefined} />
    <div className={css.runSelection}>
      <input aria-label={ru ? "Найти прогон или тег" : "Find run or tag"} placeholder={ru ? "Найти прогон или тег" : "Find run or tag"} value={runQuery} onChange={(e) => setRunQuery(e.target.value)} />
      <AnimatedSelect compact label={ru ? "Прогон" : "Run"} value={activeChoice}
        options={[{ value: "", label: ru ? "Выберите прогон" : "Choose a run" }, ...available.map((c) => ({ value: c.id,
          label: `${c.name}${c.runs[0]?.archivedAt ? (ru ? " (архив)" : " (archived)") : ""} · ${c.runs[0]?.status === "paused" ? (ru ? "Пауза" : "Paused") : localizedLabel(locale, c.runs[0]?.status ?? "draft")}` }))]}
        onChange={(id) => { const choice = browser.choices.find((c) => c.id === id); const next = choice?.runs[0]; if (next) choose(next.id, next.projectId); }} />
    </div>
    {run && <div className={css.lifecycle}><RunClock run={run} />
      {canManage && !run.archivedAt && <div>
        {(run.status === "draft" || run.status === "paused") && <button type="button" className={css.primary} disabled={browser.busy || lifecycleBlocked || startBlocked} onClick={() => void browser.act(run.status === "paused" ? "resume" : "start")}><Play size={14} />{run.status === "paused" ? (ru ? "Продолжить" : "Resume") : (ru ? "Запустить" : "Start")}</button>}
        {run.status === "active" && <button type="button" disabled={browser.busy || lifecycleBlocked} onClick={() => void browser.act("pause")}><Pause size={14} />{ru ? "Пауза" : "Pause"}</button>}
        {(run.status === "active" || run.status === "paused") && <button type="button" disabled={browser.busy || lifecycleBlocked} onClick={() => void browser.act("complete")}><Check size={14} />{ru ? "Завершить" : "Complete"}</button>}
      </div>}
    </div>}
    <div className={css.grouping}>
      <AnimatedSelect compact label={ru ? "Группировка" : "Group by"} value={group} onChange={setGroup}
        options={[{ value: "project", label: ru ? "По проектам" : "By project" }, { value: "component", label: ru ? "По компонентам" : "By component" }, { value: "tag", label: ru ? "По тегам" : "By tag" }]} />
      <AnimatedSelect compact label={ru ? "Результат" : "Result"} value={status} onChange={setStatus}
        options={[{ value: "all", label: ru ? "Все результаты" : "All results" }, ...["not_run", "in_progress", "passed", "failed", "blocked", "skipped"].map((value) => ({ value, label: localizedLabel(locale, value) }))]} />
      <button type="button" aria-label={ru ? "Обновить" : "Refresh"} onClick={browser.refresh} disabled={browser.loading || browser.busy}><RefreshCw size={14} /></button>
    </div>
    {lifecycleBlocked && <p role="status">{ru ? "Сохраните результат шага перед изменением прогона." : "Save the step result before changing the run."}</p>}
    {run?.archivedAt && !run.batchId && model.canArchiveRun && <button type="button" className={css.restore} disabled={model.archivePending} onClick={() => model.restoreSelectedRun(run)}>{ru ? "Вернуть из архива" : "Restore from archive"}</button>}
    {browser.error && <FormError message={browser.error} />}
    <div className={css.scroll} aria-busy={browser.loading}>
      {browser.loading && <p role="status">{ru ? "Загружаем кейсы…" : "Loading cases…"}</p>}
      {[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([key, entries]) => {
        const projectId = group === "project" ? key : `group:${key}`;
        const scoped = group === "project" ? entries : entries.map((c) => ({ ...c, folderPath: "/", folderId: null }));
        return <SelectionTree key={key} cases={scoped} folders={runRepositoryFolders(model.data.workspace.id, projectId, scoped)} selected={new Set()}
          ru={ru} onScope={() => {}} onToggle={() => {}} activeId={model.selectedRunItem?.id}
          heading={<><strong>{group === "project" ? model.data.projects.find((p) => p.id === key)?.name ?? key : key}</strong><span>{entries.length}</span></>}
          trailing={(item) => <span className={css.assignee}><ResponsibleName workspaceId={model.data.workspace.id}
            identityId={lookup.get(item.id)?.item.assigneeIdentityId ?? null} offline={model.connection !== "connected"} /></span>}
          accessory={(item) => <span title={localizedLabel(locale, lookup.get(item.id)?.item.status ?? "not_run")} className={css.status} data-status={lookup.get(item.id)?.item.status}>{statusIcon[lookup.get(item.id)?.item.status ?? "not_run"]}</span>}
          onOpen={(item) => { const entry = lookup.get(item.id); if (entry) choose(entry.runId, entry.projectId, entry.item.id); }} />;
      })}
      {!browser.loading && !filters.visible.length && <p className={css.empty}>{run ? (ru ? "Нет подходящих кейсов" : "No matching cases") : (ru ? "Выберите или создайте прогон" : "Choose or create a run")}</p>}
    </div>
  </aside>;
}

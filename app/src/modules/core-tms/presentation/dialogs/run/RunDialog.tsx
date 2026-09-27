import { RunCasesSkeleton } from "../../runs/loading/RunCasesSkeleton";
import { Plus, X } from "lucide-react";
import type { Bootstrap, Project, Suite, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useBatchComposer } from "../../../runs/batches/state/composer/useBatchComposer";
import { SelectionControls, useSelectionFilters } from "../../cases/selection/controls/SelectionControls";
import { SelectionTree } from "../../cases/selection/tree/SelectionTree";
import { Modal } from "../../common/modal/Modal";
import { FormError } from "../../common/error/FormError";
import { AnimatedMultiSelect } from "../../common/select/AnimatedMultiSelect";
import { useDrawerDismiss } from "../../common/drawer/useDrawerDismiss";
import { RunIterationFields } from "../run-iteration/RunIterationFields";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { RunPlatformBuildFields } from "../../../runs/builds/presentation/fields/RunPlatformBuildFields";
import styles from "./RunDialog.module.css";

type Props = {
  data: Bootstrap; project: Project; selectedSuiteId: string; presetCaseIds: string[];
  selectedSuiteDetail?: Suite | null; offline: boolean; onClose: () => void;
  onCreated: (run: TestRunSummary, runs?: TestRunSummary[]) => void;
};
export function RunDialog(props: Props) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const state = useBatchComposer(props.data, props.project, props.presetCaseIds, props.offline, ru, props.selectedSuiteId);
  const filters = useSelectionFilters(state.visibleCases);
  const selected = new Set(state.caseIds);
  const close = () => { if (!state.busy) dismiss(props.onClose); };
  const toggle = (id: string) => state.setCaseIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  const scope = (ids: readonly string[]) => state.setCaseIds((current) => ids.every((id) => current.includes(id))
    ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  const suite = props.data.suites.find((item) => item.id === state.suiteId);
  return <Modal title={ru ? "Новый прогон" : "New test run"} onClose={close} wide drawer
    panelClassName={`${styles.runPanel} ${closing ? styles.closing : ""}`}>
    <form className={styles.form} onSubmit={async (event) => {
      event.preventDefault(); const batch = await state.submit();
      if (batch) dismiss(() => props.onCreated(batch.runs[0], batch.runs));
    }} ref={(element) => { panelRef.current = element?.parentElement ?? null; if (element) element.inert = closing; }}>
      <div className={styles.body} aria-busy={state.loading || state.busy}
        ref={(element) => { if (element) element.inert = state.busy; }}>
        <RunIterationFields state={state} ru={ru} />
        <aside className={styles.properties} aria-label={ru ? "Свойства прогона" : "Run properties"}>
          <section className={styles.propertySection}>
            <h3>{ru ? "Назначение" : "Assignment"}</h3>
            <div className={styles.railField}><span>{ru ? "Ответственный" : "Assignee"}</span>
              <ResponsiblePicker workspaceId={props.data.workspace.id} value={state.assignee}
                onChange={state.setAssignee} offline={props.offline} disabled={state.busy} /></div>
            <p className={styles.hint}>{ru ? "Если не выбран, сохранятся ответственные за кейсы." : "Leave unassigned to keep each case’s assignee."}</p>
          </section>
          <section className={styles.propertySection}>
            <label className={styles.railField}><span>{ru ? "Версия релиза" : "Release version"}</span>
              <input maxLength={500} value={state.build} placeholder={ru ? "Например, 2.8.0" : "For example, 2.8.0"}
                onChange={(event) => state.setBuild(event.target.value)} /></label>
          </section>
          <RunPlatformBuildFields controller={state.platformBuilds}
            projects={props.data.projects.filter((project) => state.projectIds.includes(project.id))}
            disabled={state.busy || props.offline} ru={ru} />
        </aside>
        <section className={styles.scope} aria-label={ru ? "Тест-кейсы прогона" : "Run test cases"}>
        <div className={styles.projects}><h3>{ru ? "Тест-кейсы" : "Test cases"}</h3>
          <AnimatedMultiSelect textOnly label={ru ? "Выбрать проекты" : "Choose projects"} values={state.projectIds}
            options={props.data.projects.filter((p) => p.status !== "archived").map((p) => ({ value: p.id, label: p.name }))}
            allLabel={ru ? "Выберите проекты" : "Choose projects"} selectedLabel={ru ? "Проекты" : "Projects"}
            onChange={state.setProjectIds} /></div>
        {suite && <div className={styles.suite}><span>{suite.name}</span><small>{ru ? "Состав набора определит сервер" : "Suite membership is resolved by the server"}</small>
          <button type="button" aria-label={ru ? "Убрать набор" : "Remove suite"} onClick={() => state.setSuiteId("")}><X size={14} /></button></div>}
        <SelectionControls state={filters} ru={ru} onSelectAll={() => scope(filters.visible.filter((item) => !state.suiteId || item.projectId !== props.project.id).map((item) => item.id))} />
        {state.loading && <RunCasesSkeleton />}
        {!state.loading && state.projectIds.map((id) => <SelectionTree key={id} cases={filters.visible.filter((c) => c.projectId === id)}
          folders={state.catalog[id]?.folders ?? []} selected={selected} ru={ru} selectable
          disabled={state.loading || (Boolean(suite) && id === props.project.id)} onToggle={toggle} onScope={scope}
          heading={<><strong>{props.data.projects.find((p) => p.id === id)?.name}</strong>
            <span>{filters.visible.filter((c) => c.projectId === id).length}</span></>} />)}
        {!state.loading && !filters.visible.length && <p className={styles.hint}>{ru ? "Нет подходящих тест-кейсов" : "No matching test cases"}</p>}
        {state.loadFailed && <button type="button" className={styles.secondary} onClick={state.reload}>{ru ? "Повторить загрузку" : "Retry loading"}</button>}
        </section>
      </div>
      {state.error && <div className={styles.feedback}><FormError message={state.error} /></div>}
      <footer className={styles.footer}><span>{ru ? "Выбрано кейсов" : "Selected cases"}: {state.caseIds.length}{suite ? ` + ${suite.name}` : ""}</span>
        <button className={styles.primary} type="submit" disabled={state.busy || state.platformBuilds.uploading || state.loading || state.loadFailed || (!state.caseIds.length && !suite) || (!state.iterationId && !state.name.trim())}>
          <Plus size={15} />{state.busy ? (ru ? "Создаём…" : "Creating…") : (ru ? "Создать прогон" : "Create run")}</button></footer>
    </form>
  </Modal>;
}

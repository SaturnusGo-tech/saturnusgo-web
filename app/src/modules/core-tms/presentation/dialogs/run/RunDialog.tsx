import { Plus, X } from "lucide-react";
import type { Bootstrap, Project, Suite, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useBatchComposer } from "../../../runs/batches/state/composer/useBatchComposer";
import { SelectionControls, useSelectionFilters } from "../../cases/selection/controls/SelectionControls";
import { SelectionTree } from "../../cases/selection/tree/SelectionTree";
import { Modal } from "../../common/modal/Modal";
import { FormError } from "../../common/error/FormError";
import { AnimatedMultiSelect } from "../../common/select/AnimatedMultiSelect";
import { useRunDismiss } from "../run-motion/useRunDismiss";
import { RunIterationFields } from "../run-iteration/RunIterationFields";
import styles from "./RunDialog.module.css";

type Props = {
  data: Bootstrap; project: Project; selectedSuiteId: string; presetCaseIds: string[];
  selectedSuiteDetail?: Suite | null; offline: boolean; onClose: () => void;
  onCreated: (run: TestRunSummary, runs?: TestRunSummary[]) => void;
};
export function RunDialog(props: Props) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const { closing, dismiss, panelRef } = useRunDismiss();
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
      <div className={styles.body} aria-busy={state.loading || state.busy} inert={state.busy ? true : undefined}>
        <RunIterationFields state={state} workspaceId={props.data.workspace.id} offline={props.offline} ru={ru} />
        <div className={styles.projects}><span>{ru ? "Проекты" : "Projects"}</span>
          <AnimatedMultiSelect label={ru ? "Выбрать проекты" : "Choose projects"} values={state.projectIds}
            options={props.data.projects.filter((p) => p.status !== "archived").map((p) => ({ value: p.id, label: p.name }))}
            allLabel={ru ? "Выберите проекты" : "Choose projects"} selectedLabel={ru ? "Проекты" : "Projects"}
            onChange={state.setProjectIds} /></div>
        {suite && <div className={styles.suite}><span>{suite.name}</span><small>{ru ? "Состав набора определит сервер" : "Suite membership is resolved by the server"}</small>
          <button type="button" aria-label={ru ? "Убрать набор" : "Remove suite"} onClick={() => state.setSuiteId("")}><X size={14} /></button></div>}
        <SelectionControls state={filters} ru={ru} onSelectAll={() => scope(filters.visible.filter((item) => !state.suiteId || item.projectId !== props.project.id).map((item) => item.id))} />
        {state.loading && <p role="status">{ru ? "Загружаем кейсы…" : "Loading cases…"}</p>}
        {state.projectIds.map((id) => <SelectionTree key={id} cases={filters.visible.filter((c) => c.projectId === id)}
          folders={state.catalog[id]?.folders ?? []} selected={selected} ru={ru} selectable
          disabled={state.loading || (Boolean(suite) && id === props.project.id)} onToggle={toggle} onScope={scope}
          heading={<><strong>{props.data.projects.find((p) => p.id === id)?.name}</strong>
            <span>{filters.visible.filter((c) => c.projectId === id).length}</span></>} />)}
        {!state.loading && !filters.visible.length && <p className={styles.hint}>{ru ? "Нет подходящих тест-кейсов" : "No matching test cases"}</p>}
        {state.error && <FormError message={state.error} />}
        {state.loadFailed && <button type="button" className={styles.secondary} onClick={state.reload}>{ru ? "Повторить загрузку" : "Retry loading"}</button>}
      </div>
      <footer className={styles.footer}><span>{ru ? "Выбрано кейсов" : "Selected cases"}: {state.caseIds.length}{suite ? ` + ${suite.name}` : ""}</span>
        <button className={styles.primary} type="submit" disabled={state.busy || state.loading || state.loadFailed || (!state.caseIds.length && !suite) || (!state.iterationId && !state.name.trim())}>
          <Plus size={15} />{state.busy ? (ru ? "Создаём…" : "Creating…") : (ru ? "Создать прогон" : "Create run")}</button></footer>
    </form>
  </Modal>;
}

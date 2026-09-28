import type { CasesViewProps } from "../../types";
import type { useCasesViewController } from "../../view/useCasesViewController";
import css from "./repository-selection.module.css";

export function RepositorySelectionCommands({ props, view, ru }: {
  props: CasesViewProps; view: ReturnType<typeof useCasesViewController>; ru: boolean;
}) {
  const locked = Boolean(props.editor || props.folders?.busy);
  return <div className={css.commands} role="group" aria-label={ru ? "Выбор тест-кейсов" : "Case selection"}
    data-open={view.selectionMode || undefined} aria-hidden={!view.selectionMode}
    ref={element => { if (element) element.inert = !view.selectionMode; }}>
    <button type="button" disabled={locked || !view.selectableVisibleCount} onClick={view.bulkSelection.selectVisible}>
      {ru ? "Выбрать в папке" : "Select in folder"}</button>
    <button type="button" disabled={locked || !view.selectableCount} onClick={view.bulkSelection.selectAll}>
      {ru ? "Выбрать все" : "Select all"}</button>
  </div>;
}

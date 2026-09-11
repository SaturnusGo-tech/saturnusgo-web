import { X, CheckSquare } from "lucide-react";
import type { useRunAssignments } from "../../../runs/assignment/state/useRunAssignments";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import css from "./run-assignment.module.css";
export function RunAssignmentTools({ state, workspaceId, ru, allowed, disabled }: {
  state:ReturnType<typeof useRunAssignments>;workspaceId:string;ru:boolean;allowed:boolean;disabled:boolean;
}) {
  return <div className={css.tools}>
    <div className={css.filter}><ResponsiblePicker workspaceId={workspaceId} value={state.owner ?? null} noSelection={state.owner===undefined}
      ariaLabel={ru ? "Фильтр по ответственному" : "Filter by assignee"}
      unselectedLabel={state.owner===undefined ? (ru ? "Все ответственные" : "All assignees") : undefined}
      onChange={state.setOwner} />
      {state.owner!==undefined && <button className={css.clear} type="button" aria-label={ru ? "Сбросить ответственного" : "Clear assignee filter"} onClick={() => state.setOwner(undefined)}><X size={13}/></button>}</div>
    {allowed && <button className={css.select} type="button" disabled={disabled || state.busy} aria-pressed={state.selecting} onClick={state.toggleSelection}><CheckSquare size={14}/>{state.selecting ? (ru ? "Снять выбор" : "Clear selection") : (ru ? "Выбрать кейсы" : "Select cases")}</button>}
    {allowed && state.selecting && state.selected.size>0 && <div className={css.bar} role="region" aria-label={ru ? "Назначение выбранных кейсов" : "Assign selected cases"}>
      <strong>{ru ? "Выбрано" : "Selected"}: {state.selected.size}</strong>
      <ResponsiblePicker workspaceId={workspaceId} value={state.assignee} onChange={state.setAssignee}
        ariaLabel={ru ? "Назначить выбранные кейсы" : "Assign selected cases"} disabled={state.busy || disabled} />
      <button className={css.assign} type="button" disabled={!state.chosen || state.busy || disabled} onClick={() => void state.submit()}>{state.busy ? (ru ? "Назначаем…" : "Assigning…") : (ru ? "Назначить" : "Assign")}</button>
    </div>}
  </div>;
}

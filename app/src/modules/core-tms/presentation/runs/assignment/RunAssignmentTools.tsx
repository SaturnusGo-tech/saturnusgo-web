import { X } from "lucide-react";
import type { useRunAssignments } from "../../../runs/assignment/state/useRunAssignments";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import css from "./run-assignment.module.css";
export function RunAssignmentTools({ state, workspaceId, ru, allowed, disabled }: {
  state:ReturnType<typeof useRunAssignments>;workspaceId:string;ru:boolean;allowed:boolean;disabled:boolean;
}) {
  if (!allowed || !state.selecting || !state.selected.size) return null;
  return <div className={css.tools}>
    {allowed && state.selecting && state.selected.size>0 && <div className={css.bar} role="region" aria-label={ru ? "Назначение выбранных кейсов" : "Assign selected cases"}>
      <button className={css.clearSelection} type="button" disabled={state.busy || disabled} aria-label={ru ? "Снять выбор кейсов" : "Clear case selection"} onClick={state.toggleSelection}><X size={13} /></button>
      <strong>{ru ? "Выбрано" : "Selected"}: {state.selected.size}</strong>
      <ResponsiblePicker workspaceId={workspaceId} value={state.assignee} onChange={state.setAssignee}
        ariaLabel={ru ? "Назначить выбранные кейсы" : "Assign selected cases"} disabled={state.busy || disabled} />
      <button className={css.assign} type="button" disabled={!state.chosen || state.busy || disabled} onClick={() => void state.submit()}>{state.busy ? (ru ? "Назначаем…" : "Assigning…") : (ru ? "Назначить" : "Assign")}</button>
    </div>}
  </div>;
}

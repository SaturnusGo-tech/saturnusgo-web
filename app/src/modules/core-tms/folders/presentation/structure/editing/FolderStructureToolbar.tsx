import { PiArrowsDownUp, PiCheckSquare, PiX } from "react-icons/pi";
import type { FolderStructureEditing } from "../../../state/structure/editing/useFolderStructureEditing";
import css from "./editing.module.css";

export function FolderStructureToolbar({ editing, disabled, ru, onSelect }: { editing: FolderStructureEditing; disabled: boolean; ru: boolean; onSelect: () => void }) {
  return <div className={css.toolbar}>
    <button type="button" className={css.select} disabled={disabled} aria-pressed={editing.selecting} onClick={onSelect}>
      {editing.selecting ? <PiX size={14} /> : <PiCheckSquare size={14} />}{editing.selecting ? (ru ? "Готово" : "Done") : (ru ? "Выбрать" : "Select")}
    </button>
    {editing.selecting && <><span className={css.selectionCount} role="status">{ru ? `Выбрано: ${editing.count}` : `${editing.count} selected`}</span>
      <button type="button" className={css.move} disabled={disabled || !editing.count} onClick={editing.openMove}>
        <PiArrowsDownUp size={14} />{ru ? "Переместить" : "Move"}</button></>}
  </div>;
}

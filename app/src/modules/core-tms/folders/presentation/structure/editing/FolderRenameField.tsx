import { useEffect, useId, useRef, useState } from "react";
import { PiCheck, PiSpinnerGap, PiX } from "react-icons/pi";
import type { RepositoryFolder } from "../../../model/folder";
import type { FolderStructureEditing } from "../../../state/structure/editing/useFolderStructureEditing";
import css from "./editing.module.css";

export function FolderRenameField({ folder, editing, disabled, ru, restoreFocus }: {
  folder: RepositoryFolder; editing: FolderStructureEditing; disabled: boolean; ru: boolean; restoreFocus: () => void;
}) {
  const [name, setName] = useState(folder.name), input = useRef<HTMLInputElement>(null), errorId = useId();
  useEffect(() => { const frame = requestAnimationFrame(() => { input.current?.focus(); input.current?.select(); }); return () => cancelAnimationFrame(frame); }, []);
  function cancel() { if (!editing.saving) { editing.cancelRename(); restoreFocus(); } }
  return <form className={css.rename} aria-label={`${ru ? "Переименовать" : "Rename"} ${folder.name}`} aria-busy={editing.saving}
    onSubmit={async event => { event.preventDefault(); if (await editing.saveName(folder.id, name)) restoreFocus(); }}
    onKeyDown={event => {
      if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); }
    }}>
    <input ref={input} autoFocus required maxLength={120} value={name} disabled={disabled} aria-label={ru ? "Новое название папки" : "New folder name"}
      aria-invalid={Boolean(editing.error)} aria-describedby={editing.error ? errorId : undefined} onChange={event => setName(event.target.value)} />
    <button type="submit" disabled={disabled || !name.trim()} aria-label={ru ? "Сохранить название" : "Save folder name"}>
      {editing.saving ? <PiSpinnerGap className={css.spin} size={14} /> : <PiCheck size={14} />}</button>
    <button type="button" disabled={editing.saving} onClick={cancel} aria-label={ru ? "Отменить переименование" : "Cancel folder rename"}><PiX size={14} /></button>
    {editing.error && <span id={errorId} className={css.renameError} role="alert">{editing.error}</span>}
  </form>;
}

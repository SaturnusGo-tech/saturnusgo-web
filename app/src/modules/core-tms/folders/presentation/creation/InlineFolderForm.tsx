import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { useEffect, useId, useRef } from "react";
import { PiCheckBold, PiX, PiFolderSimpleDuotone } from "react-icons/pi";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { useInlineFolderDraft } from "../../state/creation/useInlineFolderDraft";
import css from "./quick-add.module.css";

export function InlineFolderForm({ parentId, parentName, creation, disabled, ru, restoreFocus }: {
  parentId: string | null; parentName: string; creation: RepositoryCreation; disabled: boolean; ru: boolean; restoreFocus: () => void;
}) {
  const invalidDestination = Boolean(parentId && creation.folders && !creation.folders.some(folder => folder.id === parentId));
  const draft = useInlineFolderDraft(parentId, creation, disabled || invalidDestination, ru);
  const errorId = useId();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => input.current?.focus()); return () => cancelAnimationFrame(frame); }, []);
  function cancel() { if (!draft.saving) { draft.cancel(); restoreFocus(); } }
  return <form className={css.form} aria-label={`${ru ? "Новая папка в" : "New folder in"} ${parentName}`}
    aria-busy={draft.saving} onSubmit={async event => {
      event.preventDefault();
      if (await draft.save()) { creation.close(); restoreFocus(); }
    }} onKeyDown={event => {
      if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); }
    }}>
    <div className={css.fields}>
      <PiFolderSimpleDuotone size={18} aria-hidden="true" className={css.folderIcon} />
      <input ref={input} autoFocus required maxLength={120} value={draft.name} disabled={draft.saving || disabled}
        aria-label={ru ? "Название папки" : "Folder name"} placeholder={ru ? "Название папки" : "Folder name"}
        aria-invalid={Boolean(draft.error)} aria-describedby={draft.error ? errorId : undefined}
        onChange={event => draft.setName(event.target.value)} />
      <button className={css.confirm} type="submit" disabled={!draft.canSave} aria-label={ru ? "Создать папку" : "Create folder"}
        title={ru ? "Создать папку" : "Create folder"}>{draft.saving ? <LoadingOrb /> : <PiCheckBold size={14} />}</button>
      <button className={css.cancel} type="button" disabled={draft.saving} onClick={cancel}
        aria-label={ru ? "Отменить создание папки" : "Cancel folder creation"} title={ru ? "Отменить" : "Cancel"}><PiX size={15} /></button>
    </div>
    {invalidDestination && <p role="alert" className={css.error}>{ru ? "Папка больше недоступна. Отмените создание и выберите другую ветку." : "This folder is no longer available. Cancel and choose another branch."}</p>}
    {draft.error && <p id={errorId} role="alert" className={css.error}>{draft.error}</p>}
  </form>;
}

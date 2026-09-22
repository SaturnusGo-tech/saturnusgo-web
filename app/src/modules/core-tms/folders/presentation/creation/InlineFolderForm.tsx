import { useId } from "react";
import { PiCheckBold, PiSpinnerGap, PiX } from "react-icons/pi";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { useInlineFolderDraft } from "../../state/creation/useInlineFolderDraft";
import css from "./quick-add.module.css";

export function InlineFolderForm({ parentId, parentName, creation, disabled, ru, restoreFocus }: {
  parentId: string; parentName: string; creation: RepositoryCreation; disabled: boolean; ru: boolean; restoreFocus: () => void;
}) {
  const draft = useInlineFolderDraft(parentId, creation, disabled, ru);
  const errorId = useId();
  function cancel() { if (!draft.saving) { draft.cancel(); restoreFocus(); } }
  return <form className={css.form} aria-label={`${ru ? "Новая подпапка в" : "New subfolder in"} ${parentName}`}
    aria-busy={draft.saving} onSubmit={async event => {
      event.preventDefault();
      if (await draft.save()) { creation.close(); restoreFocus(); }
    }} onKeyDown={event => {
      if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); }
    }}>
    <div className={css.fields}>
      <input autoFocus required maxLength={120} value={draft.name} disabled={draft.saving || disabled}
        aria-label={ru ? "Название подпапки" : "Subfolder name"} placeholder={ru ? "Название подпапки" : "Subfolder name"}
        aria-invalid={Boolean(draft.error)} aria-describedby={draft.error ? errorId : undefined}
        onChange={event => draft.setName(event.target.value)} />
      <button className={css.confirm} type="submit" disabled={!draft.canSave} aria-label={ru ? "Создать подпапку" : "Create subfolder"}
        title={ru ? "Создать подпапку" : "Create subfolder"}>{draft.saving ? <PiSpinnerGap className={css.spin} size={15} /> : <PiCheckBold size={14} />}</button>
      <button className={css.cancel} type="button" disabled={draft.saving} onClick={cancel}
        aria-label={ru ? "Отменить создание папки" : "Cancel folder creation"} title={ru ? "Отменить" : "Cancel"}><PiX size={15} /></button>
    </div>
    {draft.error && <p id={errorId} role="alert" className={css.error}>{draft.error}</p>}
  </form>;
}

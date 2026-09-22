import { Modal } from "../../../../../presentation/common/modal/Modal";
import type { useImportFileActions } from "../../state/useImportFileActions";
import css from "../page/import-page.module.css";

export function ImportFileDialogs({ actions, ru }: { actions: ReturnType<typeof useImportFileActions>; ru: boolean }) {
  if (actions.deletion) return <Modal title={ru ? "Удалить исходный файл?" : "Delete the original file?"} onClose={actions.cancelDelete}>
    <div className={css.dialogBody}><p className={css.previewName}>{actions.deletion.fileName}</p><p>{ru ? "Импортированные тест-кейсы и папки останутся." : "Imported test cases and folders will remain."}</p>
      {actions.error && <p className={css.error} role="alert">{actions.error}</p>}
      <button className={css.deleteButton} type="button" disabled={actions.pending} onClick={() => void actions.deleteFile()}>{actions.pending ? (ru ? "Удаляем…" : "Deleting…") : (ru ? "Удалить файл" : "Delete file")}</button></div>
  </Modal>;
  if (!actions.preview) return null;
  return <Modal title={actions.preview.file.fileName} onClose={actions.closePreview} panelClassName={css.previewDialog}>
    <div className={css.dialogBody}>{actions.pending ? <p role="status">{ru ? "Открываем файл…" : "Opening file…"}</p> : actions.error ? <p className={css.error} role="alert">{actions.error}</p>
      : <pre className={css.jsonPreview} tabIndex={0} aria-label={ru ? "Содержимое JSON" : "JSON contents"}>{actions.preview.text}</pre>}</div>
  </Modal>;
}

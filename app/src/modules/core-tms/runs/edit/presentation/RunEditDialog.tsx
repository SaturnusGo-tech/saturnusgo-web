import { useState } from "react";
import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useDrawerDismiss } from "../../../presentation/common/drawer/useDrawerDismiss";
import { Modal } from "../../../presentation/common/modal/Modal";
import { AppOverlay } from "../../../presentation/common/overlay/AppOverlay";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { RunPlatformBuildFields } from "../../builds/presentation/fields/RunPlatformBuildFields";
import { useRunEditor } from "../state/useRunEditor";
import css from "./runEdit.module.css";

export function RunEditDialog({ run, workspaceId, onClose, onSaved }: {
  run: TestRunSummary; workspaceId: string; onClose: () => void; onSaved: (run: TestRunSummary) => void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const close = () => dismiss(onClose);
  const state = useRunEditor(run.id, run.projectId, ru);
  const [confirm, setConfirm] = useState<"close" | "reload" | null>(null);
  const ask = (action: "close" | "reload") => {
    if (state.busy) return;
    if (state.draftDirty || state.uncertain) setConfirm(action);
    else if (action === "close") close(); else void state.reload();
  };
  return <AppOverlay><Modal drawer title={ru ? "Настройки прогона" : "Run settings"} subtitle={run.key}
    panelClassName={css.panel} onClose={() => ask("close")}>
    <form className={css.form} ref={element => { panelRef.current = element?.parentElement ?? null; if (element) element.inert = closing; }} onSubmit={async event => { event.preventDefault(); const updated = await state.save(); if (updated) dismiss(() => onSaved(updated)); }}>
      <div className={css.content} aria-busy={state.phase === "loading" || state.busy}>
        {state.phase === "loading" && <p role="status" className={css.hint}>{ru ? "Загружаем настройки…" : "Loading settings…"}</p>}
        {state.phase === "ready" && <>
          {!state.editable && <p role="status" className={css.hint}>{ru ? "Этот прогон завершён или находится в архиве. Его настройки нельзя изменить." : "This run is finished or archived. Its settings cannot be edited."}</p>}
          <label className={css.field}><span>{ru ? "Название" : "Name"}</span>
            <input value={state.draft.name} maxLength={240} disabled={!state.fieldsEnabled} required
              onChange={event => state.patch({ name: event.target.value })} /></label>
          <label className={css.field}><span>{ru ? "Описание" : "Description"}</span>
            <textarea value={state.draft.description} maxLength={20000} disabled={!state.fieldsEnabled} rows={2}
              onChange={event => state.patch({ description: event.target.value })} /></label>
          <div className={css.field}><span>{ru ? "Ответственный за прогон" : "Run owner"}</span>
            <ResponsiblePicker workspaceId={workspaceId} value={state.draft.ownerIdentityId} disabled={!state.fieldsEnabled}
              ariaLabel={ru ? "Ответственный за прогон" : "Run owner"} onChange={value => state.patch({ ownerIdentityId: value })} />
            <p className={css.hint}>{ru ? "Исполнители отдельных кейсов сохранятся." : "Individual case assignees stay as assigned."}</p>
          </div>
          <label className={css.field}><span>{ru ? "Теги" : "Tags"}</span>
            <input value={state.draft.tags} disabled={!state.fieldsEnabled} maxLength={1320}
              placeholder={ru ? "Через запятую" : "Separated by commas"} onChange={event => state.patch({ tags: event.target.value })} /></label>
          <div className={css.builds}><RunPlatformBuildFields controller={state.platformBuilds} projects={[{ id: run.projectId, name: "" }]}
            disabled={!state.fieldsEnabled} ru={ru} /></div>
        </>}
        {state.error && <p role="alert" className={css.error}>{state.error}</p>}
        {(state.phase === "error" || state.conflict) && <button type="button" className={css.textButton}
          disabled={state.busy} onClick={() => ask("reload")}>{ru ? "Загрузить актуальные данные" : "Reload current data"}</button>}
        {confirm && <div className={css.confirm} role="alertdialog" aria-label={ru ? "Несохранённые изменения" : "Unsaved changes"}>
          <p>{state.uncertain ? (ru ? "Результат сохранения пока неизвестен. Загруженный файл останется доступен; проверьте прогон после обновления."
            : "The save result is still unknown. The uploaded file will be retained; check the run after reloading.")
            : (ru ? "Несохранённые изменения будут отменены." : "Unsaved changes will be discarded.")}</p>
          <div><button type="button" onClick={() => setConfirm(null)}>{ru ? "Продолжить редактирование" : "Keep editing"}</button>
            <button type="button" onClick={() => { const action = confirm; setConfirm(null); if (action === "close") close(); else void state.reload(); }}>
              {confirm === "close" ? (ru ? "Закрыть" : "Close") : (ru ? "Загрузить и заменить мои правки" : "Reload and discard my edits")}</button></div>
        </div>}
      </div>
      <footer className={css.footer}><button type="button" className={css.cancel} disabled={state.busy} onClick={() => ask("close")}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="submit" className={css.save} disabled={state.phase !== "ready" || !state.editable || state.busy || state.conflict || state.platformBuilds.uploading || (!state.draftDirty && !state.uncertain)}>
          {state.busy ? (ru ? "Сохраняем…" : "Saving…") : state.uncertain ? (ru ? "Повторить сохранение" : "Retry saving") : (ru ? "Сохранить" : "Save")}</button></footer>
    </form>
  </Modal></AppOverlay>;
}

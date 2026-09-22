import { FileUp, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { AnimatedSelect } from "../../../../../presentation/common/select/AnimatedSelect";
import { ParentFolderPicker } from "../../../../../presentation/dialogs/folder/parent/ParentFolderPicker";
import type { useImportCases } from "../../../state/import/use-import-cases";
import { importCopy } from "../../../localization/import-copy";
import css from "../page/import-page.module.css";

export function ImportComposer({ state, projects, projectId, onProjectChange, ru }: {
  state: ReturnType<typeof useImportCases>; projects: readonly Project[]; projectId: string;
  onProjectChange: (id: string) => void; ru: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const copy = importCopy[ru ? "ru" : "en"];
  const disabled = state.locked || state.busy || state.phase === "reading" || !state.context;
  const hasContent = Boolean(state.document?.testCases.length || state.plan?.folders.length);
  const canStart = Boolean(state.context) && !state.busy && state.phase !== "reading" && state.phase !== "success"
    && (state.external.active || Boolean(state.plan && hasContent));
  const showImportAction = state.phase !== "success" && (state.external.active || Boolean(state.plan && hasContent) || state.busy || state.locked);
  return <div className={css.composer}>
    <div className={css.upload} data-dragging={dragging || undefined} onDragOver={event => {
      event.preventDefault(); if (!disabled) setDragging(true);
    }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) void state.selectFile(event.dataTransfer.files[0]); }}>
      <FileUp className={css.uploadIcon} size={64} strokeWidth={1.25} aria-hidden="true" />
      <div className={css.uploadText}><strong title={state.fileName}>{state.fileName || (ru ? "Добавить JSON" : "Add JSON")}</strong>
        <span>{state.fileName ? copy.format : (ru ? "Перетащите файл или выберите на компьютере" : "Drop a file or choose one from your computer")}</span>
        <input ref={input} className={css.hidden} type="file" accept="application/json,.json" aria-label={copy.choose} disabled={disabled}
          onChange={event => { void state.selectFile(event.target.files?.[0]); event.target.value = ""; }} />
        <button type="button" className={css.primary} disabled={disabled} onClick={() => input.current?.click()}>{state.fileName ? copy.replace : (ru ? "Выбрать файл" : "Choose file")}</button>
      </div>
    </div>
    <div className={css.destination}>
      <div className={css.field}><span>{ru ? "Проект" : "Project"}</span><AnimatedSelect label={ru ? "Проект для импорта" : "Import project"} value={projectId}
        options={projects.map(project => ({ value: project.id, label: project.name }))} disabled={disabled} onChange={onProjectChange} /></div>
      <fieldset className={css.field} disabled={disabled}><legend className={css.hidden}>{copy.destination}</legend><span aria-hidden="true">{ru ? "Папка" : "Folder"}</span>
        <ParentFolderPicker value={state.destination} options={[{ value: "/", label: copy.root }, ...(state.context?.folders ?? [])
          .filter(folder => !folder.archivedAt).map(folder => ({ value: folder.path, label: folder.path }))]}
          label={copy.destination} searchLabel={copy.search} emptyLabel={copy.noFolder} onChange={state.setDestination} /></fieldset>
      {showImportAction && <div className={css.importAction}>{state.busy && <button type="button" className={css.link} onClick={state.stop}>{copy.stop}</button>}
        <button type="button" className={css.primary} disabled={!canStart} onClick={() => void state.start()}>
          {state.busy && <LoaderCircle size={16} className={css.spin} />}{state.locked && !state.busy ? copy.retry : copy.start}</button></div>}
    </div>
  </div>;
}

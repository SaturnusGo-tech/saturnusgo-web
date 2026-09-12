import { CheckCircle2, FileJson, LoaderCircle, Upload } from "lucide-react";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { useImportProjects } from "../state/project/useImportProjects";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Modal } from "../../../presentation/common/modal/Modal";
import { ParentFolderPicker } from "../../../presentation/dialogs/folder/parent/ParentFolderPicker";
import { importCopy } from "../localization/import-copy";
import { useImportCases } from "../state/import/use-import-cases";
import { ImportPreviewTree } from "./ImportPreviewTree";
import styles from "../../../tms.module.css";
import css from "./import-cases.module.css";

export type ImportCasesDialogProps = Readonly<{
  project: Project; folders?: readonly RepositoryFolder[]; workspaceId?: string;
  initialFolderId?: string | null; onImported: () => Promise<unknown>; onClose: () => void;
}>;
export function ImportCasesDialog(props: ImportCasesDialogProps) {
  const { locale } = useTmsLocale();
  const [file, rememberFile] = useState<File | undefined>();
  const choice = useImportProjects(props.project, props.workspaceId);
  if (!choice.catalog || !choice.project) return <Modal title={importCopy[locale].title} onClose={props.onClose} panelClassName={css.dialog}>
    <div className={css.body}>
      {choice.error ? <><p role="alert">{locale === "ru" ? "Не удалось загрузить проекты." : "Could not load projects."}</p>
        <button type="button" className={styles.secondaryButton} onClick={choice.retry}>{importCopy[locale].retryLoad}</button></> :
        <p role="status" className={css.loading}>{choice.catalog ? (locale === "ru" ? "Нет доступных проектов для импорта." : "No projects available for import.") : <LoaderCircle className={styles.spin} size={17} />}</p>}
    </div>
  </Modal>;
  return <ImportSession key={`${choice.catalog.workspaceId}:${choice.project.id}`} {...props} project={choice.project}
    workspaceId={choice.catalog.workspaceId} folders={undefined}
    initialFolderId={choice.project.id === props.project.id ? props.initialFolderId : null}
    projects={choice.catalog.projects} onProjectChange={choice.setSelectedId} initialFile={file} rememberFile={rememberFile} />;
}
function ImportSession(props: ImportCasesDialogProps & { projects: Project[]; onProjectChange: (id: string) => void; initialFile?: File; rememberFile: (file: File) => void }) {
  const { locale } = useTmsLocale();
  const copy = importCopy[locale];
  const state = useImportCases({ ...props, locale });
  const input = useRef<HTMLInputElement>(null);
  const restored = useRef(false);
  useEffect(() => {
    if (!state.context || restored.current) return;
    restored.current = true;
    if (props.initialFile) void state.selectFile(props.initialFile);
  }, [state.context, props.initialFile]);
  const total = state.document?.testCases.length ?? 0;
  const hasContent = total > 0 || (state.plan?.folders.length ?? 0) > 0;
  const status = state.phase === "converting" ? (locale === "ru" ? "Подготавливаем тест-кейсы…" : "Preparing test cases…") : state.phase === "folders" ? copy.folderProgress : state.phase === "importing" ? copy.caseProgress :
    state.phase === "success" ? copy.complete : state.phase === "partial" ? copy.partial :
    state.phase === "stopped" ? copy.stopped : "";
  const close = () => { state.stop(); props.onClose(); };
  return <Modal title={copy.title} subtitle={copy.subtitle} onClose={close} panelClassName={css.dialog}>
    <div className={css.body}>
      <div className={css.location}>
      <fieldset className={css.destination} disabled={state.locked || state.busy || state.phase === "reading"}>
        <legend>{locale === "ru" ? "Проект" : "Project"}</legend>
        <AnimatedSelect label={locale === "ru" ? "Проект для импорта" : "Import project"} value={props.project.id}
          options={props.projects.map(project => ({ value: project.id, label: project.name }))}
          disabled={state.locked || state.busy || state.phase === "reading"} onChange={props.onProjectChange} />
      </fieldset>
        {state.context && <fieldset className={css.destination} disabled={state.locked || state.busy}>
          <legend>{copy.destination}</legend>
          <ParentFolderPicker value={state.destination} options={[{ value: "/", label: copy.root },
            ...state.context.folders.filter((folder) => !folder.archivedAt).sort((a, b) => a.path.localeCompare(b.path))
              .map((folder) => ({ value: folder.path, label: folder.path }))]}
            label={copy.destination} searchLabel={copy.search} emptyLabel={copy.noFolder} onChange={state.setDestination} />
        </fieldset>}
      </div>
      {state.phase === "loading" ? <p role="status" className={css.loading}><LoaderCircle className={styles.spin} size={17} />{copy.loading}</p> : <>
        <div className={css.fileArea} data-selected={Boolean(state.fileName)}
          onDragOver={event => { event.preventDefault(); }}
          onDrop={event => { event.preventDefault(); if (state.locked || state.busy) return;
            const file = event.dataTransfer.files[0]; if (file) { props.rememberFile(file); void state.selectFile(file); } }}>
          <FileJson size={25} strokeWidth={1.5} aria-hidden="true" />
          <div><strong>{state.fileName || copy.files}</strong><span>{copy.format}</span></div>
          <input ref={input} type="file" accept="application/json,.json" className={css.hidden}
            aria-label={copy.choose} disabled={state.locked || state.busy || !state.context}
            onChange={(event) => { const file = event.target.files?.[0]; if (file) { props.rememberFile(file); void state.selectFile(file); } }} />
          <button type="button" className={css.fileButton} disabled={state.locked || state.busy || !state.context || state.phase === "reading"}
            onClick={() => input.current?.click()}><Upload size={15} />{state.fileName ? copy.replace : copy.choose}</button>
        </div>
        {state.phase === "reading" && <p className={css.hint} role="status">{copy.reading}</p>}
        {state.plan && state.phase === "success" && <details className={css.resultTree}>
          <summary>{copy.preview}</summary><ImportPreviewTree plan={state.plan} copy={copy} />
        </details>}
        {!state.busy && !state.locked && <p className={css.hint}>{copy.rules}</p>}
      </>}
      {status && <div role="status" className={css.status} data-success={state.phase === "success"}>
        <strong>{state.phase === "success" && <CheckCircle2 size={17} />}{status}</strong>
        {state.phase === "converting" ? <span>{state.external.progress.records
          ? `${state.external.progress.processed} / ${state.external.progress.records.length}`
          : locale === "ru" ? "Читаем структуру файла…" : "Reading the file structure…"}</span> : <span>{copy.done}: {state.completed} / {total}</span>}
        {state.busy && total > 0 && <progress value={state.attempted} max={total} aria-label={copy.processed} />}
      </div>}
      {(state.phase === "partial" || state.phase === "stopped") && <p className={css.hint}>{copy.partialRule}</p>}
      {state.error && <p role="alert" className={css.error}>{state.error}</p>}
      {state.failed.length > 0 && <details className={css.failures}><summary>{copy.errors}: {state.failed.length}</summary>
        <ul>{state.failed.map((item, index) => <li key={index}><strong>{item.sourceKey}</strong> — {item.message}</li>)}</ul>
      </details>}
      {!state.context && state.error && <button type="button" className={styles.secondaryButton} onClick={state.retryContext}>{copy.retryLoad}</button>}
    </div>
    <footer className={css.footer}>
      <button type="button" className={styles.secondaryButton} onClick={state.busy ? state.stop : close}>
        {state.busy ? copy.stop : state.phase === "success" ? copy.close : copy.cancel}</button>
      {state.phase !== "success" && <button type="button" className={styles.primaryButton}
        disabled={state.busy || (!state.external.active && (!state.plan || !hasContent)) || state.phase === "reading" || !state.context}
        onClick={() => void state.start()}>{state.busy && <LoaderCircle size={15} className={styles.spin} />}
        {state.phase === "converting" ? (locale === "ru" ? "Подготовка…" : "Preparing…") : state.locked ? copy.retry : copy.start}</button>}
    </footer>
  </Modal>;
}

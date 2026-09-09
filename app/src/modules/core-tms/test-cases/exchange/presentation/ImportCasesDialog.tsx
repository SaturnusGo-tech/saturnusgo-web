import { CheckCircle2, FileJson, LoaderCircle, Upload } from "lucide-react";
import { useRef } from "react";
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
  project: Project; folders: readonly RepositoryFolder[]; workspaceId?: string;
  initialFolderId?: string | null; onImported: () => Promise<unknown>; onClose: () => void;
}>;
export function ImportCasesDialog(props: ImportCasesDialogProps) {
  const { locale } = useTmsLocale();
  const copy = importCopy[locale];
  const state = useImportCases(props);
  const input = useRef<HTMLInputElement>(null);
  const total = state.document?.testCases.length ?? 0;
  const hasContent = total > 0 || (state.plan?.folders.length ?? 0) > 0;
  const status = state.phase === "folders" ? copy.folderProgress : state.phase === "importing" ? copy.caseProgress :
    state.phase === "success" ? copy.complete : state.phase === "partial" ? copy.partial :
    state.phase === "stopped" ? copy.stopped : "";
  const close = () => { state.stop(); props.onClose(); };
  return <Modal title={copy.title} subtitle={`${props.project.name} · ${copy.subtitle}`} onClose={close} panelClassName={css.dialog}>
    <div className={css.body}>
      {state.phase === "loading" ? <p role="status" className={css.loading}><LoaderCircle className={styles.spin} size={17} />{copy.loading}</p> : <>
        <div className={css.fileArea}>
          <FileJson size={25} strokeWidth={1.5} aria-hidden="true" />
          <div><strong>{state.fileName || copy.files}</strong><span>{copy.format}</span></div>
          <input ref={input} type="file" accept="application/json,.json" className={css.hidden}
            aria-label={copy.choose} disabled={state.locked || !state.context}
            onChange={(event) => void state.selectFile(event.target.files?.[0])} />
          <button type="button" className={styles.secondaryButton} disabled={state.locked || !state.context || state.phase === "reading"}
            onClick={() => input.current?.click()}><Upload size={15} />{state.fileName ? copy.replace : copy.choose}</button>
        </div>
        {state.phase === "reading" && <p className={css.hint} role="status">{copy.reading}</p>}
        {state.context && <fieldset className={css.destination} disabled={state.locked}>
          <legend>{copy.destination}</legend>
          <ParentFolderPicker value={state.destination} options={[{ value: "/", label: copy.root },
            ...state.context.folders.filter((folder) => !folder.archivedAt).sort((a, b) => a.path.localeCompare(b.path))
              .map((folder) => ({ value: folder.path, label: folder.path }))]}
            label={copy.destination} searchLabel={copy.search} emptyLabel={copy.noFolder} onChange={state.setDestination} />
        </fieldset>}
        {state.plan && <>
          <dl className={css.counts}>
            <div><dt>{copy.cases}</dt><dd>{total}</dd></div>
            <div><dt>{copy.newFolders}</dt><dd>{state.plan.newFolderCount}</dd></div>
            <div><dt>{copy.existingFolders}</dt><dd>{state.plan.existingFolderCount}</dd></div>
          </dl>
          {hasContent ? <ImportPreviewTree plan={state.plan} copy={copy} /> : <p className={css.hint}>{copy.noData}</p>}
          {!state.locked && <p className={css.hint}>{copy.rules}</p>}
        </>}
      </>}
      {status && <div role="status" className={css.status} data-success={state.phase === "success"}>
        <strong>{state.phase === "success" && <CheckCircle2 size={17} />}{status}</strong>
        <span>{copy.done}: {state.completed} / {total}</span>
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
        disabled={state.busy || !state.plan || !hasContent || state.phase === "reading" || !state.context}
        onClick={() => void state.start()}>{state.busy && <LoaderCircle size={15} className={styles.spin} />}
        {state.locked ? copy.retry : copy.start}</button>}
    </footer>
  </Modal>;
}

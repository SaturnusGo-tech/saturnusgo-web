import { CheckCircle2, LoaderCircle } from "lucide-react";
import type { useImportCases } from "../../../state/import/use-import-cases";
import { importCopy } from "../../../localization/import-copy";
import { ImportPreviewTree } from "../../../presentation/ImportPreviewTree";
import css from "../page/import-page.module.css";

export function ImportProgress({ state, ru }: { state: ReturnType<typeof useImportCases>; ru: boolean }) {
  const copy = importCopy[ru ? "ru" : "en"];
  const status = state.phase === "saving" ? (ru ? "Сохраняем исходный файл…" : "Saving the original file…")
    : state.phase === "converting" ? (ru ? "Подготавливаем тест-кейсы…" : "Preparing test cases…")
    : state.phase === "folders" ? copy.folderProgress : state.phase === "importing" ? copy.caseProgress
    : state.phase === "success" ? copy.complete : state.phase === "partial" ? copy.partial : state.phase === "stopped" ? copy.stopped
    : state.phase === "loading" ? copy.loading : state.phase === "reading" ? copy.reading : "";
  return <div className={css.progressArea}>
    {status && <p className={css.message} role="status">{state.phase === "success" ? <CheckCircle2 className={css.success} size={18} /> : (state.busy || state.phase === "loading" || state.phase === "reading") && <LoaderCircle size={18} className={css.spin} />}
      <span>{status}{["importing", "partial", "success", "stopped"].includes(state.phase) && ` · ${state.completed} / ${state.document?.testCases.length ?? 0}`}</span></p>}
    {state.phase === "importing" && <progress value={state.attempted} max={state.document?.testCases.length || 1} aria-label={copy.processed} />}
    {state.error && <p className={css.error} role="alert">{state.error}</p>}
    {!state.context && state.error && <button className={css.link} type="button" onClick={state.retryContext}>{copy.retryLoad}</button>}
    {state.failed.length > 0 && <details><summary>{copy.errors}: {state.failed.length}</summary><ul>{state.failed.map((item, index) => <li key={index}>{item.sourceKey}: {item.message}</li>)}</ul></details>}
    {(state.phase === "partial" || state.phase === "stopped") && <p className={css.hint}>{copy.partialRule}</p>}
    {state.plan && !state.busy && <details className={css.previewTree}><summary>{copy.preview}</summary><ImportPreviewTree plan={state.plan} copy={copy} /></details>}
  </div>;
}

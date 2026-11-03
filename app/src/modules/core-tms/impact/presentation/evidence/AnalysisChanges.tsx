import { FileCode2 } from "lucide-react";
import type { ImpactAnalysis } from "../../model/impact-types";
import { impactLabel } from "../../model/impact-copy";
import { ReviewCollection } from "../review/ReviewCollection";
import css from "./evidence.module.css";

export function AnalysisChanges({ analysis, ru }: { analysis: ImpactAnalysis; ru: boolean }) {
  const result = analysis.result;
  return <section className={css.evidence} aria-label={ru ? "Изменения кода" : "Code changes"}>
    <h3>{ru ? "Затронутые области" : "Affected areas"}</h3>
    {result?.impactedAreas.length ? <ul className={css.areas}>{result.impactedAreas.map((area, index) => <li key={index}>
      <details><summary><strong>{area.area}</strong><span>{area.platform} · {area.changedFiles.length} {ru ? "файлов" : "files"}</span></summary>
        <ul className={css.notes}>{area.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>
        <ul className={css.files}>{area.changedFiles.map(file => <li key={file}>{file}</li>)}</ul>
      </details></li>)}</ul> : <p className={css.muted}>{ru ? "Нет определённых областей." : "No affected areas reported."}</p>}
    <h3>{ru ? "Изменённые файлы" : "Changed files"} <span>{analysis.change.files.length}</span></h3>
    <ReviewCollection items={analysis.change.files} ru={ru} label={ru ? "Файлы" : "Files"} text={file => [file.path, file.previousPath, file.status].join(" ")}>
      {file => <li key={file.path} className={css.file}><FileCode2 size={15} aria-hidden="true" /><span><strong title={file.path}>{file.path}</strong>
        {file.previousPath && <small title={file.previousPath}>{ru ? "Ранее:" : "Previously:"} {file.previousPath}</small>}</span><small>{file.status}</small></li>}
    </ReviewCollection>
    {!analysis.change.files.length && <p className={css.muted}>{ru ? "Нет изменённых файлов." : "No changed files."}</p>}
    <details className={css.technical}><summary>{ru ? "Сборки и техническая информация" : "Builds and analysis details"}</summary>
      <ul className={css.notes}>{analysis.builds.map((item, index) => <li key={index}>{item.name} · {impactLabel(item.status, ru)} · {ru ? "попытка" : "attempt"} {item.attempt}</li>)}</ul>
      {result && <p className={css.muted}>{ru ? "Последний AI-анализ" : "Last AI analysis"}: {impactLabel(result.ai.status, ru)} · {result.ai.model || result.ai.provider || "—"}{result.ai.errorCode && ` · ${result.ai.errorCode}`}</p>}
      {result?.notes.length ? <ul className={css.notes}>{result.notes.map((note, index) => <li key={index}>{note}</li>)}</ul> : null}
    </details>
  </section>;
}

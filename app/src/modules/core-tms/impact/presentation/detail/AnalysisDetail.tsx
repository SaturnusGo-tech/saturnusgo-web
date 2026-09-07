import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useImpactAnalysis } from "../../application/detail/useImpactAnalysis";
import type { ImpactPermissions, ImpactScope } from "../../model/impact-types";
import { impactLabel } from "../../model/impact-copy";
import { safeImpactLink } from "../../navigation/impact-navigation";
import { buildWorkspaceDeepLink } from "../../../state/navigation/workspace-deep-link";
import { ScopeReview } from "../scope/ScopeReview";
import { CoverageGaps } from "../gaps/CoverageGaps";
import { AnalysisHistory } from "../history/AnalysisHistory";
import css from "../styles/impact.module.css";
export function AnalysisDetail({ scope, id, ru, permissions, onBack }: {
  scope: ImpactScope; id: string; ru: boolean; permissions: ImpactPermissions; onBack: () => void;
}) {
  const state = useImpactAnalysis(scope, id, permissions, ru); const data = state.data;
  const source = safeImpactLink(data?.change.sourceUrl); const build = safeImpactLink(data?.change.buildUrl);
  const runHref = data?.runId && typeof window !== "undefined" ? buildWorkspaceDeepLink(window.location.href,
    { ...scope, view: "runs", runId: data.runId }) : null;
  const busy = state.pending || Boolean(state.unresolved) || !state.identityReady || !state.etag;
  return <div className={css.root}>
    <div className={css.heading}><button type="button" onClick={onBack}><ArrowLeft size={14} />{ru ? "Все анализы" : "All analyses"}</button>
      <button type="button" disabled={state.pending || state.loading} onClick={() => void state.refresh()}><RefreshCw size={14} />{ru ? "Обновить" : "Refresh"}</button></div>
    {state.error && <p className={css.error} role="alert">{state.error}</p>}
    {!state.identityReady && <p className={css.notice}>{ru ? "Для сохранения решений войдите в аккаунт повторно." : "Sign in again to save review decisions."}</p>}
    {data && !state.etag && <p className={css.notice}>{ru ? "Не удалось проверить актуальность анализа. Обновите данные перед сохранением." : "The analysis version could not be verified. Reload before saving decisions."}</p>}
    {state.loading && !data && <p role="status">{ru ? "Загружаем анализ…" : "Loading analysis…"}</p>}
    {state.unresolved && <div className={css.notice} role="status"><p>{ru ? "У предыдущего действия ещё нет подтверждённого результата. Повтор безопасно проверит его завершение." : "A previous action has no confirmed result yet. Retry safely checks its outcome."}</p>
      <button type="button" disabled={state.pending || !state.canRetryUnresolved} onClick={() => state.unresolved && void state.command(state.unresolved.command)}>{ru ? "Повторить запрос" : "Retry request"}</button></div>}
    {data && <>
      <section className={css.panel}><header className={css.heading}><div><h2>Impact Analysis</h2><p>{data.change.repository} · {data.change.platform} · {data.change.branch}</p></div>
        <span className={css.badge}>{impactLabel(data.status, ru)}</span></header>
        <div className={css.meta}><code className={css.code}>SHA {data.change.sha}</code>{data.change.prNumber && <span>PR #{data.change.prNumber}</span>}
          <span>{ru ? "Сборка" : "Build"}: {impactLabel(data.buildStatus, ru)}</span><span>{data.change.author}</span></div>
        <div className={css.actions} style={{ marginTop: 12 }}>{source && <a href={source} target="_blank" rel="noreferrer">GitHub <ExternalLink size={12} /></a>}
          {build && <a href={build} target="_blank" rel="noreferrer">GitHub Actions <ExternalLink size={12} /></a>}
          {runHref && <a href={runHref} className={css.button}>{ru ? "Открыть тест-ран" : "Open test run"}</a>}</div>
        {data.errorCode && <p className={css.error} role="alert">{ru ? "Анализ не завершён:" : "Analysis incomplete:"} {data.errorCode}</p>}
        {data.change.truncated && <p className={css.notice}>{ru ? "Список изменений неполный. Проверьте исходный diff перед подтверждением." : "The change list is incomplete. Review the source diff before approval."}</p>}
        {(data.status === "failed" || data.result?.ai.status === "failed" || data.result?.ai.status === "unavailable") && permissions.configure && <button type="button" disabled={busy} onClick={() => void state.command({ action: "retry", body: {} })}>{ru ? "Повторить анализ" : "Retry analysis"}</button>}
        {data.result && <><p style={{ lineHeight: 1.65 }}>{data.result.summary}</p><span className={css.badge} data-warning={data.result.riskLevel === "high" || data.result.riskLevel === "critical" || undefined}>{ru ? "Риск" : "Risk"}: {impactLabel(data.result.riskLevel, ru)}</span>
          <ul className={css.list} style={{ marginTop: 14 }}>{data.result.impactedAreas.map((area, index) => <li key={index} className={css.row}>
            <strong>{area.area} <span className={css.badge}>{area.platform}</span></strong><ul className={css.files}>{area.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>
            <details><summary>{ru ? "Связанные файлы" : "Related files"}</summary><ul className={css.files}>{area.changedFiles.map((file) => <li key={file}>{file}</li>)}</ul></details></li>)}</ul>
          {data.result.notes.length > 0 && <ul className={css.files}>{data.result.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>}
          <p className={css.muted} style={{ marginTop: 12 }}>{ru ? "AI-анализ" : "AI analysis"}: {impactLabel(data.result.ai.status, ru)} · {data.result.ai.model || data.result.ai.provider || "—"}
            {data.result.ai.errorCode && ` · ${data.result.ai.errorCode}`}</p></>}
        <details style={{ marginTop: 12 }}><summary>{ru ? "Сборки и изменённые файлы" : "Builds and changed files"}</summary>
          <ul className={css.files}>{data.builds.map((item, index) => <li key={index}>{item.name} · {impactLabel(item.status, ru)} · {ru ? "попытка" : "attempt"} {item.attempt}</li>)}</ul>
          <ul className={css.files}>{data.change.files.map((file, index) => <li key={index}>{file.status}: {file.previousPath ? `${file.previousPath} → ` : ""}{file.path}</li>)}</ul></details>
      </section>
      {!permissions.review && <p className={css.notice}>{ru ? "Режим просмотра без права изменять и подтверждать состав." : "Read-only access: scope editing and approval are unavailable."}</p>}
      <ScopeReview analysis={data} scope={scope} ru={ru} writable={permissions.review} pending={busy} command={state.command} />
      <CoverageGaps analysis={data} ru={ru} writable={permissions.manageCases} pending={busy} command={state.command} />
      {permissions.audit ? <AnalysisHistory analysis={data} ru={ru} /> : <p className={css.muted}>{ru ? "Журнал решений доступен администратору и QA-менеджеру." : "Decision history is available to administrators and QA managers."}</p>}
    </>}
  </div>;
}

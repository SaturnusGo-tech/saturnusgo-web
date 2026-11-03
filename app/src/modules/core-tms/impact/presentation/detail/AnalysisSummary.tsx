import { useState } from "react";
import { Check, CircleX, ExternalLink, GitBranch, GitCommitHorizontal, RefreshCw } from "lucide-react";
import type { ImpactAnalysis } from "../../model/impact-types";
import { impactLabel } from "../../model/impact-copy";
import { safeImpactLink } from "../../navigation/impact-navigation";
import { buildWorkspaceDeepLink } from "../../../state/navigation/workspace-deep-link";
import { AnalysisAvailability } from "../availability/AnalysisAvailability";
import shared from "../styles/impact.module.css";
import css from "./detail.module.css";

export function AnalysisSummary({ data, ru, pending, canRetry, onRetry }: {
  data: ImpactAnalysis; ru: boolean; pending: boolean; canRetry: boolean; onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const source = safeImpactLink(data.change.sourceUrl), build = safeImpactLink(data.change.buildUrl);
  const runHref = data.runId && typeof window !== "undefined" ? buildWorkspaceDeepLink(window.location.href, { workspaceId: data.workspaceId, projectId: data.projectId, view: "runs", runId: data.runId }) : null;
  const failed = data.status === "failed" || data.result?.ai.status === "failed" || data.result?.ai.status === "unavailable";
  const status = data.approved ? (ru ? "Состав подтверждён" : "Scope approved") : impactLabel(data.status, ru);
  const Build = data.buildStatus === "success" ? Check : data.buildStatus === "pending" ? RefreshCw : CircleX;
  const created = new Date(data.createdAt).toLocaleString(ru ? "ru-RU" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const repositoryParts = data.change.repository.split("/"), repositoryName = repositoryParts[repositoryParts.length - 1];
  return <header className={css.summary}>
    <div className={css.titleRow}><div><h2>{repositoryName}{data.change.prNumber && <span>#{data.change.prNumber}</span>}</h2>
      <p className={css.byline}>{data.change.repository} · {data.change.author} · <time dateTime={data.createdAt}>{created}</time></p></div>
      {runHref && <a className={css.runLink} href={runHref}>{ru ? "Открыть прогон" : "Open run"}<ExternalLink size={13} /></a>}
    </div>
    <div className={css.metadata}>
      <span className={css.badge} data-tone={data.approved ? "success" : data.status === "failed" ? "danger" : "neutral"}>{status}</span>
      <span className={css.build} data-build={data.buildStatus}><Build size={13} />{impactLabel(`build_${data.buildStatus}`, ru)}</span>
      {data.result && <span className={css.risk} data-risk={data.result.riskLevel}>{ru ? "Риск" : "Risk"}: {impactLabel(data.result.riskLevel, ru)}</span>}
    </div>
    <div className={css.source}>
      <span title={data.change.branch}><GitBranch size={13} /><span>{data.change.branch}</span></span>
      <span title={data.change.sha}><GitCommitHorizontal size={14} /><code>{data.change.sha.slice(0, 8)}</code></span>
      {source && <a href={source} target="_blank" rel="noreferrer">GitHub<ExternalLink size={12} /></a>}
      {build && <a href={build} target="_blank" rel="noreferrer">{ru ? "Сборка" : "Build"}<ExternalLink size={12} /></a>}
    </div>
    {data.result ? <div className={css.description}><p data-expanded={expanded || undefined}>{data.result.summary}</p>
      {data.result.summary.length > 240 && <button className={css.textButton} type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? (ru ? "Свернуть" : "Show less") : (ru ? "Читать полностью" : "Read full summary")}</button>}</div>
      : <p className={css.muted}>{ru ? "Результат анализа ещё не получен." : "Analysis results are not available yet."}</p>}
    {data.aiEnabled !== false && (data.errorCode || data.result?.ai.errorCode) && <AnalysisAvailability code={data.errorCode || data.result!.ai.errorCode!} ru={ru} />}
    {data.change.truncated && <p className={shared.notice}>{ru ? "Список изменений неполный. Проверьте исходный diff перед подтверждением." : "The change list is incomplete. Review the source diff before approval."}</p>}
    {failed && canRetry && <button type="button" className={css.quiet} disabled={pending} onClick={onRetry}><RefreshCw size={14} />{data.aiEnabled === false ? (ru ? "Пересчитать рекомендации" : "Recalculate recommendations") : (ru ? "Повторить анализ" : "Retry analysis")}</button>}
  </header>;
}

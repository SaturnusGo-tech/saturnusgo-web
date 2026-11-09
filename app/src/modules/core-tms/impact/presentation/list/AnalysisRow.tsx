import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { Check, ChevronRight, Circle, CircleCheck, CircleX, Clock3, GitPullRequest } from "lucide-react";
import type { ImpactAnalysis } from "../../model/impact-types";
import { analysisNeedsAttention, openCoverageGapCount } from "../../model/catalog/analysis-catalog";
import { impactLabel } from "../../model/impact-copy";
import css from "./catalog.module.css";

export function AnalysisRow({ item, ru, onSelect }: { item: ImpactAnalysis; ru: boolean; onSelect: (id: string) => void }) {
  const title = item.result?.summary || item.change.branch;
  const attention = analysisNeedsAttention(item), active = item.status === "pending" || item.status === "processing";
  const tone = attention ? "warning" : active ? "info" : item.approved ? "success" : "neutral";
  const Status = attention ? CircleX : item.approved ? CircleCheck : active ? Clock3 : Circle;
  const status = attention ? (ru ? "Внимание" : "Attention") : item.approved ? (ru ? "Подтверждён" : "Approved")
    : active ? impactLabel(item.status, ru) : (ru ? "На проверку" : "To review");
  const Build = item.buildStatus === "success" ? Check : CircleX;
  const count = item.scope.filter(test => test.included).length, gaps = openCoverageGapCount(item);
  return <li className={css.row} data-analysis-id={item.id}>
    <button type="button" className={css.open} onClick={() => onSelect(item.id)} aria-label={`${ru ? "Открыть анализ" : "Review analysis"}: ${title}`}>
      <span className={css.change}><GitPullRequest size={17} strokeWidth={1.6} aria-hidden="true" /><span className={css.copy}>
        <strong title={title}>{title}</strong><span className={css.meta} title={`${item.change.repository} · ${item.change.branch} · ${item.change.sha}`}>
          {item.buildStatus === "pending"
            ? <LoadingOrb size="xs" label={impactLabel("build_pending", ru)} />
            : <Build size={12} data-build={item.buildStatus} aria-label={impactLabel(`build_${item.buildStatus}`, ru)} />}
          <span>{item.change.repository} · {item.change.prNumber ? `#${item.change.prNumber}` : item.change.sha.slice(0, 7)} · {item.change.branch}</span>
        </span></span></span>
      <span className={css.status} data-tone={tone} title={item.errorCode || status}><Status size={13} aria-hidden="true" />{status}</span>
      <span className={css.risk} data-risk={item.result?.riskLevel ?? "none"}>{item.result ? impactLabel(item.result.riskLevel, ru) : "—"}</span>
      <span className={css.coverage}>{item.result ? <><span>{count} {ru ? "кейсов" : "cases"}</span><small data-gaps={gaps > 0 || undefined}>{gaps ? `${gaps} ${ru ? "пробелов" : "gaps"}` : (ru ? "Без пробелов" : "No gaps")}</small></> : <span>—</span>}</span>
      <time className={css.date} dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString(ru ? "ru-RU" : "en-GB")}>{new Date(item.createdAt).toLocaleDateString(ru ? "ru-RU" : "en-GB", { day: "numeric", month: "short" })}</time>
      <ChevronRight size={15} className={css.chevron} aria-hidden="true" />
    </button>
  </li>;
}

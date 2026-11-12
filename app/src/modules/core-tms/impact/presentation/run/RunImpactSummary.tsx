import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { useState } from "react";
import { ArrowUpRight, ChevronRight, X } from "lucide-react";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import type { useImpactList } from "../../application/list/useImpactList";
import type { ImpactAnalysis, ImpactScope } from "../../model/impact-types";
import { impactLabel } from "../../model/impact-copy";
import { impactHref } from "../../navigation/impact-navigation";
import css from "./run-impact.module.css";

export function RunImpactSummary({ state, scope, ru }: {
  state: ReturnType<typeof useImpactList>; scope: ImpactScope; ru: boolean;
}) {
  const subject = useOptionalTmsSession()?.subject;
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const proposalKey = (item: ImpactAnalysis) => `falcon.run-impact.dismissed.v1:${JSON.stringify([
    subject, scope.workspaceId, scope.projectId, item.runId, item.id, item.rowVersion, item.change.sha,
  ])}`;
  const hidden = (item: ImpactAnalysis) => {
    const key = proposalKey(item);
    if (dismissed.has(key)) return true;
    try { return Boolean(subject && typeof window !== "undefined" && window.localStorage.getItem(key) === "1"); }
    catch { return false; }
  };
  const dismiss = (item: ImpactAnalysis) => {
    const key = proposalKey(item);
    setDismissed(previous => new Set([...previous, key]));
    try { if (subject) window.localStorage.setItem(key, "1"); } catch { /* Dismissal still works in this view when storage is unavailable. */ }
  };
  if (state.error) return <ErrorToast message={ru ? "Не удалось проверить предложение для этого прогона." : "Could not check the proposal for this run."}
    retryLabel={ru ? "Повторить" : "Retry"} onRetry={() => void state.refresh()} />;
  if (!state.ready) return null;
  const visible = state.items.filter(item => !hidden(item));
  if (!visible.length) return null;
  return <section className={css.root} aria-label="Impact Analysis">
    {visible.map(item => <article className={css.proposal} key={proposalKey(item)}>
      <details className={css.details}>
        <summary><ChevronRight className={css.chevron} size={15} strokeWidth={1.6} aria-hidden="true" />
          <span className={css.copy}><span className={css.heading}><strong>Impact Analysis</strong>
            <span className={css.repository} title={item.change.repository}>{item.change.repository}{item.change.prNumber ? ` #${item.change.prNumber}` : ""}</span></span>
            <span className={css.status}>{item.approved ? (ru ? "Состав подтверждён QA" : "Scope approved by QA")
              : (ru ? "Перед запуском подтвердите состав" : "Review the scope before starting")}</span>
          </span>
        </summary>
        <div className={css.evidence}>
          <p>{item.result?.summary || (ru ? "Результат анализа ещё не получен." : "Analysis results are not available yet.")}</p>
          <p className={css.metadata}>{ru ? "Тестов в составе" : "Tests in scope"}: {item.scope.filter(row => row.included).length}
            {item.result && <> · {ru ? "Риск" : "Risk"}: {impactLabel(item.result.riskLevel, ru)}</>}</p>
          {item.approvalBlockedReasons.length > 0 && <ul>{item.approvalBlockedReasons.map(reason => <li key={reason}>{impactLabel(reason, ru)}</li>)}</ul>}
        </div>
      </details>
      <a className={css.review} href={impactHref(typeof window === "undefined" ? "https://tms.invalid/work/" : window.location.href, scope, item.id)}>
        {ru ? "Причины и состав" : "Reasons and scope"}<ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" /></a>
      <IntegrationButton type="button" className={css.dismiss} onPress={() => dismiss(item)}
        aria-label={`${ru ? "Скрыть предложение анализа" : "Dismiss analysis proposal"}: ${item.change.repository}`}
        title={ru ? "Скрыть это предложение" : "Dismiss this proposal"}><X size={15} strokeWidth={1.6} aria-hidden="true" /></IntegrationButton>
    </article>)}
  </section>;
}

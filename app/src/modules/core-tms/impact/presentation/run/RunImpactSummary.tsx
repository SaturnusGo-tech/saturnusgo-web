import type { useImpactList } from "../../application/list/useImpactList";
import type { ImpactScope } from "../../model/impact-types";
import { impactHref } from "../../navigation/impact-navigation";
import css from "../styles/impact.module.css";
export function RunImpactSummary({ state, scope, ru }: {
  state: ReturnType<typeof useImpactList>; scope: ImpactScope; ru: boolean;
}) {
  if (state.ready && !state.items.length) return null;
  if (state.error) return <div className={css.root}><div className={css.error} role="alert">
    {ru ? "Не удалось проверить предложение для этого прогона." : "Could not check the proposal for this run."}
    <button type="button" onClick={() => void state.refresh()}>{ru ? "Повторить" : "Retry"}</button></div></div>;
  if (!state.ready) return <p role="status" className={css.muted}>{ru ? "Проверяем состав прогона…" : "Checking run proposal…"}</p>;
  return <div className={css.root}><div className={css.notice}>
    {state.items.map((analysis) => <div className={css.rowHeading} key={analysis.id}>
      <span><strong>Impact Analysis</strong> · {analysis.change.repository} · {analysis.approved
        ? (ru ? "Состав подтверждён QA" : "Scope approved by QA") : (ru ? "Перед запуском требуется подтверждение состава" : "Scope approval is required before starting")}</span>
      <a className={css.button} href={impactHref(typeof window === "undefined" ? "https://tms.invalid/work/" : window.location.href, scope, analysis.id)}>{ru ? "Причины и состав" : "Review reasons and scope"}</a>
    </div>)}
  </div></div>;
}

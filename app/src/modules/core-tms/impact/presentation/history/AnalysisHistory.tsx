import { useImpactHistory } from "../../application/history/useImpactHistory";
import type { ImpactAnalysis } from "../../model/impact-types";
import { impactLabel } from "../../model/impact-copy";
import css from "../styles/impact.module.css";
export function AnalysisHistory({ analysis, ru }: { analysis: ImpactAnalysis; ru: boolean }) {
  const state = useImpactHistory(analysis, analysis.id, analysis.rowVersion, ru);
  return <section className={css.panel}><header className={css.heading}><h3>{ru ? "Журнал решений" : "Decision history"}</h3></header>
    {state.error && <p className={css.error} role="alert">{state.error}<button type="button" onClick={() => void state.more()}>{ru ? "Повторить" : "Retry"}</button></p>}
    {state.loading && <p role="status">{ru ? "Загружаем журнал…" : "Loading history…"}</p>}
    <ol className={css.list}>{state.items.map((item) => <li className={css.row} key={item.id}>
      <div className={css.rowHeading}><strong>{impactLabel(item.action, ru)}</strong><time dateTime={item.createdAt} className={css.muted}>{new Date(item.createdAt).toLocaleString(ru ? "ru-RU" : "en-GB")}</time></div>
      <span className={css.muted}>{item.actor === "system" ? (ru ? "Автоматизация" : "Automation") : item.actor}</span>
      <details><summary>{ru ? "Данные решения" : "Decision details"}</summary><pre className={css.code}>{JSON.stringify(item.details, null, 2)}</pre></details>
    </li>)}</ol>
    {!state.loading && !state.error && !state.items.length && <p className={css.muted}>{ru ? "Решений ещё нет." : "No decisions recorded yet."}</p>}
    {state.next && <button type="button" disabled={state.loading} onClick={() => void state.more()}>{ru ? "Загрузить ещё" : "Load more"}</button>}
  </section>;
}

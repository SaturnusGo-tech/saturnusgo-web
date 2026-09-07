import { ArrowRight, RefreshCw } from "lucide-react";
import { useImpactList } from "../../application/list/useImpactList";
import type { ImpactScope } from "../../model/impact-types";
import { impactLabel } from "../../model/impact-copy";
import css from "../styles/impact.module.css";
export function AnalysisList({ scope, ru, enabled, onSelect }: {
  scope: ImpactScope; ru: boolean; enabled: boolean; onSelect: (id: string) => void;
}) {
  const state = useImpactList(scope, enabled, ru);
  return <section className={css.panel} aria-label="Impact Analysis">
    <header className={css.heading}><div><h2>Impact Analysis</h2><p>{ru ? "Изменения кода, затронутые области и предложения для проверки." : "Code changes, affected areas, and proposed verification scope."}</p></div>
      <button type="button" onClick={() => void state.refresh()} disabled={state.loading}><RefreshCw size={14} />{ru ? "Обновить" : "Refresh"}</button></header>
    {state.error && <p className={css.error} role="alert">{state.error}</p>}
    {state.loading && <p role="status">{ru ? "Загружаем анализы…" : "Loading analyses…"}</p>}
    {state.ready && state.items.length === 0 && <p className={css.empty}>{ru ? "Анализов пока нет. Настройте репозитории: следующие подходящие события GitHub появятся здесь, в том числе без выбранных тестов." : "No analyses yet. Configure repositories to receive matching GitHub events here, including proposals with no selected tests."}</p>}
    <ol className={css.list}>{state.items.map((item) => <li className={css.row} key={item.id}>
      <div className={css.rowHeading}><strong>{item.change.repository}</strong><span className={css.badge} data-warning={item.status === "failed" || undefined}>{impactLabel(item.status, ru)}</span></div>
      <div className={css.meta}><span>{item.change.branch}</span><code>{item.change.sha.slice(0, 12)}</code>
        {item.change.prNumber && <span>PR #{item.change.prNumber}</span>}<span>{new Date(item.createdAt).toLocaleString(ru ? "ru-RU" : "en-GB")}</span></div>
      <p className={css.muted}>{item.result?.summary || (ru ? "Результат анализа ещё не получен." : "Analysis results are not available yet.")}</p>
      <div className={css.rowHeading}><span className={css.muted}>{item.approved ? (ru ? "Состав подтверждён" : "Scope approved") : item.runId ? (ru ? "Предложение ожидает проверки QA" : "Proposal awaits QA review") : (ru ? "Тест-ран ещё не создан" : "No test run yet")}</span>
        <button type="button" onClick={() => onSelect(item.id)}>{ru ? "Открыть анализ" : "Review analysis"}<ArrowRight size={14} /></button></div>
    </li>)}</ol>
    {state.next && <button type="button" disabled={state.loading} onClick={() => void state.more()}>{ru ? "Загрузить ещё" : "Load more"}</button>}
  </section>;
}

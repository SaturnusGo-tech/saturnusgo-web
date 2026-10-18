import type { ImpactScope } from "../../model/impact-types";
import { useImpactCases } from "../../application/cases/useImpactCases";
import { ReviewCollection } from "../review/ReviewCollection";
import css from "../styles/impact.module.css";
export function CasePicker({ scope, ru, included, disabled, onAdd }: { scope: ImpactScope; ru: boolean; included: string[]; disabled: boolean; onAdd: (id: string) => Promise<void> }) {
  const state = useImpactCases(scope, ru);
  return <div className={css.panel} style={{ marginTop: 12 }}>
    <label className={css.field}>{ru ? "Поиск готовых тестов проекта" : "Search ready project tests"}
      <input type="search" maxLength={300} value={state.query} onChange={(event) => state.setQuery(event.target.value)} /></label>
    {state.error && <p role="alert" className={css.error}>{state.error}</p>}
    {state.loading && <p role="status">{ru ? "Загружаем тесты…" : "Loading tests…"}</p>}
    <ReviewCollection items={state.items} ru={ru} searchable={false} label={ru ? "Готовые тесты" : "Ready tests"} text={(item) => item.title}>{(item) => <li key={item.id} className={css.row}>
      <div className={css.rowHeading}><span><strong>{item.key}</strong> {item.title}</span>
        <button type="button" disabled={disabled || included.includes(item.id)} onClick={() => void onAdd(item.id)}>{included.includes(item.id) ? (ru ? "Добавлен" : "Included") : (ru ? "Добавить" : "Add")}</button></div>
    </li>}</ReviewCollection>
    {!state.loading && !state.error && state.items.length === 0 && <p className={css.muted}>{ru ? "Готовых тестов не найдено." : "No ready tests found."}</p>}
    {state.next && <button type="button" onClick={() => void state.more()} disabled={state.loading}>{ru ? "Загрузить ещё" : "Load more"}</button>}
  </div>;
}

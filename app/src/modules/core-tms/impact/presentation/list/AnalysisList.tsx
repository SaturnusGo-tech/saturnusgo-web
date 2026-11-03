import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, SearchX, X } from "lucide-react";
import { useImpactList } from "../../application/list/useImpactList";
import type { ImpactScope } from "../../model/impact-types";
import { analysisCatalog, type AnalysisFilter } from "../../model/catalog/analysis-catalog";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { ImpactAiBanner } from "../banner/ImpactAiBanner";
import { AnalysisRow } from "./AnalysisRow";
import css from "./catalog.module.css";

export function AnalysisList({ scope, ru, enabled, onSelect }: {
  scope: ImpactScope; ru: boolean; enabled: boolean; onSelect: (id: string) => void;
}) {
  const state = useImpactList(scope, enabled, ru);
  const [query, setQuery] = useState(""), [filter, setFilter] = useState<AnalysisFilter>("all"), [page, setPage] = useState(1);
  const list = useRef<HTMLElement>(null);
  const rows = analysisCatalog(state.items, query, filter, page);
  const options = [
    { value: "all", label: ru ? "Все анализы" : "All analyses" },
    { value: "review", label: ru ? "На проверку" : "To review" },
    { value: "attention", label: ru ? "Требуют внимания" : "Needs attention" },
    { value: "approved", label: ru ? "Подтверждены" : "Approved" },
    { value: "active", label: ru ? "В процессе" : "In progress" },
  ];
  const movePage = (next: number) => {
    setPage(next);
    list.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const reset = () => { setQuery(""); setFilter("all"); setPage(1); };
  return <section className={css.catalog} aria-label="Impact Analysis" ref={list} aria-busy={state.loading}>
    <header className={css.header}>
      <div><h2>Impact Analysis <span>{state.items.length}{state.next ? "+" : ""}</span></h2>
        <p>{ru ? "Проверьте изменения, выберите кейсы и закройте пробелы покрытия." : "Review changes, select cases and close coverage gaps."}</p></div>
      <button type="button" className={css.iconButton} aria-label={ru ? "Обновить анализы" : "Refresh analyses"}
        title={ru ? "Обновить" : "Refresh"} disabled={state.loading} onClick={() => void state.refresh()}><RefreshCw size={16} /></button>
    </header>
    {state.aiEnabled === false && <ImpactAiBanner ru={ru} />}
    <div className={css.toolbar}>
      <label className={css.search} data-input-shell><Search size={16} aria-hidden="true" />
        <input type="search" aria-label={ru ? "Поиск по загруженным анализам" : "Search loaded analyses"} maxLength={300}
          placeholder={ru ? "Репозиторий, ветка или PR" : "Repository, branch or PR"} value={query}
          onChange={event => { setQuery(event.target.value); setPage(1); }} />
        {query && <button className={css.iconButton} type="button" aria-label={ru ? "Очистить поиск" : "Clear search"} onClick={() => { setQuery(""); setPage(1); }}><X size={14} /></button>}
      </label>
      <AnimatedSelect className={css.filter} compact label={ru ? "Статус анализа" : "Analysis status"} value={filter} options={options}
        onChange={value => { setFilter(value as AnalysisFilter); setPage(1); }} />
    </div>
    {state.error && <div role="alert" className={css.error}><p>{state.error}</p><button type="button" className={css.quiet} disabled={state.loading} onClick={() => void state.refresh()}>{ru ? "Повторить" : "Retry"}</button></div>}
    {state.loading && !state.ready && <p className={css.empty} role="status">{ru ? "Загружаем анализы…" : "Loading analyses…"}</p>}
    {rows.items.length > 0 && <>
      <div className={css.columns} aria-hidden="true"><span>{ru ? "Изменение" : "Change"}</span><span>{ru ? "Статус" : "Status"}</span><span>{ru ? "Риск" : "Risk"}</span><span>{ru ? "Покрытие" : "Coverage"}</span><span className={css.date}>{ru ? "Создан" : "Created"}</span><span /></div>
      <ul className={css.list} aria-label={ru ? "Анализы изменений" : "Change analyses"}>
        {rows.items.map(item => <AnalysisRow key={item.id} item={item} ru={ru} onSelect={onSelect} />)}
      </ul>
    </>}
    {state.ready && !rows.total && <div className={css.empty}><SearchX size={26} strokeWidth={1.5} aria-hidden="true" />
      <h3>{state.items.length ? (ru ? "Анализы не найдены" : "No matching analyses") : (ru ? "Анализов пока нет" : "No analyses yet")}</h3>
      <p>{state.items.length ? (ru ? "Измените запрос или статус." : "Try another search or status.") : (ru ? "Подключите репозиторий во вкладке «Репозитории». Изменения GitHub появятся здесь." : "Configure a repository in the Repositories tab. GitHub changes will appear here.")}</p>
      {state.items.length > 0 && <button className={css.quiet} type="button" onClick={reset}>{ru ? "Сбросить фильтры" : "Reset filters"}</button>}
    </div>}
    {state.ready && state.items.length > 0 && <footer className={css.footer}>
      <span role="status">{rows.start}–{rows.end} / {rows.total}{state.next ? (ru ? " загруженных · есть ещё" : " loaded · more available") : ""}</span>
      <nav aria-label={ru ? "Страницы анализов" : "Analysis pages"}>
        <button className={css.iconButton} type="button" aria-label={ru ? "Предыдущая страница" : "Previous page"} disabled={rows.page === 1} onClick={() => movePage(rows.page - 1)}><ChevronLeft size={16} /></button>
        <span>{rows.page} / {rows.pages}</span>
        <button className={css.iconButton} type="button" aria-label={ru ? "Следующая страница" : "Next page"} disabled={rows.page === rows.pages} onClick={() => movePage(rows.page + 1)}><ChevronRight size={16} /></button>
      </nav>
      {state.next && <button type="button" className={css.quiet} disabled={state.loading} onClick={() => void state.more()}>{state.loading ? (ru ? "Загружаем…" : "Loading…") : (ru ? "Загрузить ещё" : "Load more")}</button>}
    </footer>}
  </section>;
}

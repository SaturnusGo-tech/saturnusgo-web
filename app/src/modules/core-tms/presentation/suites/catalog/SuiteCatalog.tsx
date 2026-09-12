import { Layers, Play, Plus, Search, X } from "lucide-react";
import type { Suite, SuiteSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { filterSuiteCatalog, suiteCatalogCount, type SuiteCatalogFilter, type SuiteCatalogSort } from "../../../suites/catalog/suite-catalog";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { SuiteCatalogFilters } from "./filters/SuiteCatalogFilters";
import shared from "../suites.module.css";
import css from "./catalog.module.css";

type Props = {
  suites: SuiteSummary[]; detail: Suite | null; projectName: string;
  query: string; onQuery: (query: string) => void;
  filter: SuiteCatalogFilter; onFilter: (filter: SuiteCatalogFilter) => void;
  sort: SuiteCatalogSort; onSort: (sort: SuiteCatalogSort) => void;
  canManage: boolean; canRun: boolean; onOpen: (id: string) => void; onRun: (id: string) => void; onCreate: () => void;
};
export function SuiteCatalog(props: Props) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const rows = filterSuiteCatalog(props.suites, props.query, props.filter, props.sort, locale);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return <>
    <header className={shared.header}><h1>{t("suite.title")} <span>{props.suites.length}</span></h1></header>
    <div className={css.toolbar}>
      <label className={`${shared.search} ${css.search}`} data-input-shell><Search size={16} aria-hidden="true" />
        <input aria-label={t("suite.searchAria")} placeholder={ru ? "Найти сьют" : "Find a suite"} value={props.query} onChange={e => props.onQuery(e.target.value)} />
        {props.query && <button type="button" aria-label={ru ? "Очистить поиск" : "Clear search"} onClick={() => props.onQuery("")}><X size={14} /></button>}
      </label>
      <SuiteCatalogFilters ru={ru} filter={props.filter} onFilter={props.onFilter} sort={props.sort} onSort={props.onSort} />
      {props.canManage && <button type="button" className={shared.primary} data-testid="new-suite" onClick={props.onCreate}><Plus size={16} />{ru ? "Новый сьют" : "New suite"}</button>}
    </div>
    {rows.length ? <section className={css.repository} aria-label={t("suite.title")}>
      <div className={css.project}><strong>{props.projectName}</strong><span>{rows.length}</span></div>
      <ul className={css.list}>{rows.map(suite => {
        const count = suiteCatalogCount(suite, props.detail);
        return <li key={suite.id} data-suite-id={suite.id} className={css.row}>
          <button type="button" data-open-suite className={css.name} onClick={() => props.onOpen(suite.id)}>
            <Layers size={21} strokeWidth={1.6} aria-hidden="true" /><span><strong>{suite.name}</strong><small>{suite.key}</small></span>
          </button>
          <span className={css.mode}>{suite.status === "archived" ? (ru ? "В архиве" : "Archived") : suite.type === "dynamic" ? (ru ? "По тегам" : "By tags") : (ru ? "Вручную" : "Manual")}</span>
          <span className={css.count} title={ru ? "Кейсов в наборе" : "Cases in suite"}>{count === null ? "—" : count.toLocaleString(locale)}</span>
          <time className={css.date} dateTime={suite.updatedAt}>{date.format(new Date(suite.updatedAt))}</time>
          {props.canRun && <button type="button" className={shared.play} aria-label={`${ru ? "Запустить сьют" : "Run suite"}: ${suite.name}`} title={ru ? "Запустить прогон" : "Start run"}
            disabled={suite.status === "archived"} onClick={() => props.onRun(suite.id)}><Play size={16} fill="currentColor" /></button>}
        </li>;
      })}</ul>
    </section> : <div className={shared.empty}><Layers size={26} strokeWidth={1.4} aria-hidden="true" />
      <h2>{props.suites.length ? (ru ? "Сьюты не найдены" : "No matching suites") : (ru ? "Нет тест-сьютов" : "No test suites yet")}</h2>
      <p>{props.suites.length ? (ru ? "Измените запрос или фильтр." : "Change the search or filter.") : (ru ? "Соберите проверки для повторных запусков." : "Group checks for repeated runs.")}</p>
      {props.suites.length > 0 && <button type="button" className={shared.quiet} onClick={() => { props.onQuery(""); props.onFilter("all"); }}>{ru ? "Сбросить поиск и фильтр" : "Reset search and filter"}</button>}
    </div>}
  </>;
}

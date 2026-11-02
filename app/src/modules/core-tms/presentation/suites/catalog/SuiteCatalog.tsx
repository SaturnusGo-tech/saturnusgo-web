import { Play, Plus, Search, Stack, X } from "@openai/apps-sdk-ui/components/Icon";
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
  return <div className={shared.page}>
    <header className={shared.header}>
      <div><h1>{t("suite.title")} <span>{props.suites.length}</span></h1><p className={shared.subtitle}>{ru ? "Наборы проверок для каждого релиза." : "Reusable test coverage for every release."}</p></div>
      <div className={css.toolbar}>
        <label className={`${shared.search} ${css.search}`} data-input-shell><Search width={18} height={18} aria-hidden="true" />
          <input aria-label={t("suite.searchAria")} placeholder={ru ? "Найти сьют" : "Find a suite"} value={props.query} onChange={e => props.onQuery(e.target.value)} />
          {props.query && <button type="button" aria-label={ru ? "Очистить поиск" : "Clear search"} onClick={() => props.onQuery("")}><X width={14} height={14} /></button>}
        </label>
        <SuiteCatalogFilters ru={ru} filter={props.filter} onFilter={props.onFilter} sort={props.sort} onSort={props.onSort} />
        {props.canManage && <button type="button" className={shared.primary} data-testid="new-suite" onClick={props.onCreate}><Plus width={18} height={18} />{ru ? "Новый сьют" : "New suite"}</button>}
      </div>
    </header>
    {rows.length ? <section className={css.repository} aria-label={t("suite.title")}>
      <div className={css.project}><strong>{props.projectName}</strong><span>{ru ? `${rows.length} из ${props.suites.length}` : `${rows.length} of ${props.suites.length}`}</span></div>
      <ul className={css.list}>{rows.map(suite => {
        const count = suiteCatalogCount(suite, props.detail);
        const description = suite.description.replace(/[#*_~`]/g, "").replace(/\s+/g, " ").trim();
        return <li key={suite.id} data-suite-id={suite.id} className={css.row} data-archived={suite.status === "archived" || undefined}>
          <button type="button" data-open-suite className={css.name} onClick={() => props.onOpen(suite.id)}>
            <span className={css.icon}><Stack width={22} height={22} aria-hidden="true" /></span>
            <span className={css.copy}><strong title={suite.name}>{suite.name}</strong><span className={css.summary}><small>{suite.key}</small>{description && <span>{description}</span>}</span></span>
          </button>
          <span className={css.mode}>{suite.status === "archived" ? (ru ? "В архиве" : "Archived") : suite.type === "dynamic" ? (ru ? "Динамический" : "Dynamic") : (ru ? "Вручную" : "Manual")}</span>
          <span className={css.count} title={count === null ? (ru ? "Откройте сьют, чтобы проверить текущий состав" : "Open this suite to resolve its current membership") : (ru ? "Кейсов в наборе" : "Cases in suite")}>
            {count === null ? "—" : count.toLocaleString(locale)}<span>{ru ? " кейсов" : " cases"}</span>
          </span>
          <time className={css.date} dateTime={suite.updatedAt} title={ru ? "Обновлён" : "Updated"}>{date.format(new Date(suite.updatedAt))}</time>
          {props.canRun && <button type="button" className={css.run} aria-label={`${ru ? "Запустить сьют" : "Run suite"}: ${suite.name}`}
            disabled={suite.status === "archived" || (suite.type === "static" && count === 0)} onClick={() => props.onRun(suite.id)}><Play width={17} height={17} /><span>{ru ? "Запустить" : "Run"}</span></button>}
        </li>;
      })}</ul>
    </section> : <div className={shared.empty}><Stack width={30} height={30} aria-hidden="true" />
      <h2>{props.suites.length ? (ru ? "Сьюты не найдены" : "No matching suites") : (ru ? "Нет тест-сьютов" : "No test suites yet")}</h2>
      <p>{props.suites.length ? (ru ? "Измените запрос или фильтр." : "Change the search or filter.") : (ru ? "Соберите проверки, которые удобно запускать вместе." : "Bring together the checks you want to run together.")}</p>
      {props.suites.length > 0 && <button type="button" className={shared.quiet} onClick={() => { props.onQuery(""); props.onFilter("all"); }}>{ru ? "Сбросить поиск и фильтр" : "Reset search and filter"}</button>}
      {!props.suites.length && props.canManage && <button type="button" className={shared.primary} onClick={props.onCreate}><Plus width={18} height={18} />{ru ? "Создать сьют" : "Create a suite"}</button>}
    </div>}
  </div>;
}

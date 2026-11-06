import { ChevronRight, Play, Plus, Stack } from "@openai/apps-sdk-ui/components/Icon";
import type { Suite, SuiteSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { filterSuiteCatalog, suiteCatalogCount, type SuiteCatalogFilter, type SuiteCatalogSort } from "../../../suites/catalog/suite-catalog";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { SuiteKindBadge } from "../shared/kind/SuiteKindBadge";
import { AnimatedSearch } from "../../common/search/AnimatedSearch";
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
  return <div className={shared.catalogPage}>
    <header className={shared.header}>
      <div><h1>{t("suite.title")} <span>{props.suites.length}</span></h1></div>
      <div className={css.toolbar}>
        <AnimatedSearch value={props.query} onChange={props.onQuery} label={t("suite.searchAria")}
          placeholder={ru ? "Найти сьют" : "Find a suite"} openLabel={ru ? "Найти сьют" : "Search suites"} closeLabel={ru ? "Закрыть поиск" : "Close search"} />
        <SuiteCatalogFilters ru={ru} filter={props.filter} onFilter={props.onFilter} sort={props.sort} onSort={props.onSort} />
        {props.canManage && <button type="button" className={shared.primary} data-testid="new-suite" onClick={props.onCreate}><Plus width={18} height={18} />{ru ? "Новый сьют" : "New suite"}</button>}
      </div>
    </header>
    {rows.length ? <section className={css.repository} aria-label={t("suite.title")}>
      <div className={css.project}><span className={css.projectName}><span title={props.projectName}>{props.projectName}</span>{rows.length !== props.suites.length && <small>{rows.length} / {props.suites.length}</small>}</span><span>{ru ? "Состав" : "Membership"}</span><span>{ru ? "Кейсы" : "Cases"}</span><span className={css.date}>{ru ? "Обновлён" : "Updated"}</span><span /></div>
      <ul className={css.list}>{rows.map(suite => {
        const count = suiteCatalogCount(suite, props.detail);
        const description = suite.description.replace(/[#*_~`]/g, "").replace(/\s+/g, " ").trim();
        return <li key={suite.id} data-suite-id={suite.id} className={css.row} data-archived={suite.status === "archived" || undefined}>
          <button type="button" data-open-suite className={css.name} onClick={() => props.onOpen(suite.id)}>
            <span className={css.key} title={suite.key}>{suite.key}</span><span className={css.copy}><strong title={suite.name}>{suite.name}</strong>{description && <span className={css.summary} title={description}>{description}</span>}</span>
          </button>
          <span className={css.mode}><SuiteKindBadge type={suite.type} archived={suite.status === "archived"} ru={ru} /></span>
          <span className={css.count} title={count === null ? (ru ? "Откройте сьют, чтобы проверить текущий состав" : "Open this suite to resolve its current membership") : (ru ? "Кейсов в наборе" : "Cases in suite")}>
            {count === null ? <button type="button" className={css.resolve} aria-label={`${ru ? "Посмотреть кейсы" : "View cases"}: ${suite.name}`} onClick={() => props.onOpen(suite.id)}>{ru ? "Смотреть" : "View cases"}<ChevronRight width={12} height={12} /></button> : <span data-empty={count === 0 || undefined}>{count.toLocaleString(locale)}<span className={css.countLabel}>{ru ? " кейсов" : " cases"}</span></span>}
          </span>
          <time className={css.date} dateTime={suite.updatedAt} title={ru ? "Обновлён" : "Updated"}>{date.format(new Date(suite.updatedAt))}</time>
          {props.canRun && <button type="button" className={css.run} aria-label={`${ru ? "Запустить сьют" : "Run suite"}: ${suite.name}`}
            disabled={suite.status === "archived" || (suite.type === "static" && count === 0)} onClick={() => props.onRun(suite.id)}><Play width={16} height={16} /></button>}
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

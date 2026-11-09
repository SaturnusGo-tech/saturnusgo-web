import { Button } from "@heroui/react";
import { ChevronRight, Play, Plus, Stack } from "@openai/apps-sdk-ui/components/Icon";
import type { Suite, SuiteSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { filterSuiteCatalog, suiteCatalogCount, type SuiteCatalogFilter, type SuiteCatalogSort } from "../../../suites/catalog/suite-catalog";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
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
        {props.canManage && <Button type="button" size="sm" disableRipple className={shared.primary} data-testid="new-suite" onPress={props.onCreate}>
          <Plus width={18} height={18} aria-hidden="true" />{ru ? "Новый сьют" : "New suite"}
        </Button>}
      </div>
    </header>
    {rows.length ? <section className={css.repository} aria-label={t("suite.title")}>
      <h2 className={css.project}>
        <span title={props.projectName}>{props.projectName}</span>
        {rows.length !== props.suites.length && <small>{rows.length} / {props.suites.length}</small>}
      </h2>
      <ul className={css.list} role="list">{rows.map(suite => {
        const count = suiteCatalogCount(suite, props.detail);
        const archived = suite.status === "archived";
        const runLabel = ru ? "Запустить сьют" : "Run suite";
        return <li key={suite.id} data-suite-id={suite.id} className={css.row} data-archived={archived || undefined}>
          <button type="button" data-open-suite className={css.name} onClick={() => props.onOpen(suite.id)}>
            <SuiteKindBadge type={suite.type} archived={archived} ru={ru} iconOnly />
            <strong title={suite.name}>{suite.name}</strong>
          </button>
          <span className={css.metadata}>
            <span className={css.key} title={suite.key}>{suite.key}</span>
            {count === null ? <Button type="button" size="sm" variant="light" disableRipple className={css.resolve}
              title={ru ? "Откройте сьют, чтобы проверить текущий состав" : "Open this suite to resolve its current membership"}
              aria-label={`${ru ? "Посмотреть кейсы" : "View cases"}: ${suite.name}`} onPress={() => props.onOpen(suite.id)}>
              {ru ? "Смотреть" : "View cases"}<ChevronRight width={12} height={12} aria-hidden="true" />
            </Button> : <span className={css.count} data-empty={count === 0 || undefined}>
              {formatCount(locale, count, ["case", "cases"], ["кейс", "кейса", "кейсов"])}
            </span>}
            <time className={css.date} dateTime={suite.updatedAt} title={ru ? "Обновлён" : "Updated"}>{date.format(new Date(suite.updatedAt))}</time>
          </span>
          {props.canRun && <Button type="button" size="sm" isIconOnly variant="light" disableRipple className={css.run}
            aria-label={`${runLabel}: ${suite.name}`} title={runLabel}
            isDisabled={archived || (suite.type === "static" && count === 0)} onPress={() => props.onRun(suite.id)}>
            <Play width={16} height={16} aria-hidden="true" />
          </Button>}
        </li>;
      })}</ul>
    </section> : <div className={shared.empty}><Stack width={30} height={30} aria-hidden="true" />
      <h2>{props.suites.length ? (ru ? "Сьюты не найдены" : "No matching suites") : (ru ? "Нет тест-сьютов" : "No test suites yet")}</h2>
      <p>{props.suites.length ? (ru ? "Измените запрос или фильтр." : "Change the search or filter.") : (ru ? "Соберите проверки, которые удобно запускать вместе." : "Bring together the checks you want to run together.")}</p>
      {props.suites.length > 0 && <Button type="button" size="sm" variant="light" disableRipple className={shared.quiet}
        onPress={() => { props.onQuery(""); props.onFilter("all"); }}>{ru ? "Сбросить поиск и фильтр" : "Reset search and filter"}</Button>}
      {!props.suites.length && props.canManage && <Button type="button" size="sm" disableRipple className={shared.primary} onPress={props.onCreate}>
        <Plus width={18} height={18} aria-hidden="true" />{ru ? "Создать сьют" : "Create a suite"}
      </Button>}
    </div>}
  </div>;
}

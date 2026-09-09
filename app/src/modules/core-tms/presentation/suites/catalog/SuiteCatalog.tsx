import { ChevronRight, Layers, Play, Plus, Search, Tag, UserRound, X } from "lucide-react";
import type { Suite, SuiteSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { filterSuiteCatalog, hasResolvedSuiteCount, suiteCatalogCount, type SuiteCatalogFilter, type SuiteCatalogSort } from "../../../suites/catalog/suite-catalog";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import shared from "../suites.module.css";
import styles from "./catalog.module.css";

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
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const modes = [{ id: "all" as const, label: ru ? "Все" : "All" }, { id: "static" as const, label: ru ? "Вручную" : "Manual" }, { id: "dynamic" as const, label: ru ? "По тегам" : "By tags" }];
  return <>
    <div className={shared.context}>{props.projectName}</div>
    <header className={shared.header}>
      <div><h1>{t("suite.title")} <span>{props.suites.length}</span></h1><p>{ru ? "Наборы тест-кейсов для повторных запусков" : "Reusable test case sets for your runs"}</p></div>
      {props.canManage && <button type="button" className={shared.primary} data-testid="new-suite" onClick={props.onCreate}><Plus size={17} />{ru ? "Новый сьют" : "New suite"}</button>}
    </header>
    <div className={styles.toolbar}>
      <label className={`${shared.search} ${styles.search}`} data-input-shell><Search size={16} aria-hidden="true" />
        <input aria-label={t("suite.searchAria")} placeholder={ru ? "Найти сьют" : "Find a suite"} value={props.query} onChange={e => props.onQuery(e.target.value)} />
        {props.query && <button type="button" aria-label={ru ? "Очистить поиск" : "Clear search"} onClick={() => props.onQuery("")}><X size={14} /></button>}
      </label>
      <div className={styles.tabs} role="group" aria-label={ru ? "Состав сьюта" : "Suite composition"}>
        {modes.map(mode => <button type="button" key={mode.id} aria-pressed={props.filter === mode.id} onClick={() => props.onFilter(mode.id)}>{mode.label}</button>)}
      </div>
      <AnimatedSelect className={styles.sort} label={ru ? "Сортировка" : "Sort"} value={props.sort} onChange={value => props.onSort(value as SuiteCatalogSort)}
        options={[{ value: "updated", label: ru ? "Обновлённые" : "Recently updated" }, { value: "name", label: ru ? "По названию" : "Name" }, { value: "created", label: ru ? "Недавно созданные" : "Recently created" }]} />
    </div>
    {rows.length ? <div className={styles.tableWrap}><table className={styles.table} aria-label={t("suite.title")}>
      <colgroup><col className={styles.nameCol} /><col className={styles.modeCol} /><col className={styles.countCol} /><col className={styles.dateCol} /><col className={styles.actionCol} /></colgroup>
      <thead><tr><th scope="col">{ru ? "Название" : "Name"}</th><th scope="col">{ru ? "Состав" : "Composition"}</th><th scope="col" className={styles.number}>{ru ? "Кейсы" : "Cases"}</th><th scope="col" className={styles.date}>{ru ? "Обновлён" : "Updated"}</th><th scope="col"><span className={styles.srOnly}>{ru ? "Действия" : "Actions"}</span></th></tr></thead>
      <tbody>{rows.map(suite => {
        const count = suiteCatalogCount(suite, props.detail);
        return <tr key={suite.id} data-suite-id={suite.id} onClick={() => props.onOpen(suite.id)}>
          <td><button type="button" data-open-suite className={styles.name} onClick={event => { event.stopPropagation(); props.onOpen(suite.id); }}>
            <Layers size={21} strokeWidth={1.6} aria-hidden="true" /><span><strong>{suite.name}</strong>{suite.description.trim() && <small>{suite.description.trim()}</small>}{suite.status === "archived" && <small>{ru ? "В архиве" : "Archived"}</small>}</span>
          </button></td>
          <td><span className={styles.mode}>{suite.type === "dynamic" ? <Tag size={15} aria-hidden="true" /> : <UserRound size={15} aria-hidden="true" />}{suite.type === "dynamic" ? (ru ? "По тегам" : "By tags") : (ru ? "Вручную" : "Manual")}</span></td>
          <td className={styles.number}><span title={count === null ? (ru ? "Состав рассчитывается по тегам при открытии сьюта и запуске" : "Tag-based scope is resolved when opening or running the suite") : !hasResolvedSuiteCount(suite, props.detail) ? (ru ? "Сохранённый состав. Доступные для запуска кейсы уточняются при открытии сьюта." : "Saved membership. Runnable cases are resolved when opening the suite.") : undefined}>{count === null ? "—" : count.toLocaleString(locale)}</span></td>
          <td className={styles.date}><time dateTime={suite.updatedAt}>{date.format(new Date(suite.updatedAt))}</time></td>
          <td><div className={styles.actions}>
            {props.canRun && <button type="button" className={styles.iconButton} aria-label={`${ru ? "Запустить сьют" : "Run suite"}: ${suite.name}`} title={ru ? "Запустить прогон" : "Start run"} disabled={suite.status === "archived"} onClick={event => { event.stopPropagation(); props.onRun(suite.id); }}><Play size={18} strokeWidth={1.6} /></button>}
            <button type="button" className={styles.iconButton} aria-label={`${ru ? "Открыть сьют" : "Open suite"}: ${suite.name}`} onClick={event => { event.stopPropagation(); props.onOpen(suite.id); }}><ChevronRight size={17} /></button>
          </div></td>
        </tr>;
      })}</tbody>
    </table></div> : <div className={shared.empty}><Layers size={26} strokeWidth={1.4} aria-hidden="true" /><h2>{props.suites.length ? (ru ? "Сьюты не найдены" : "No matching suites") : (ru ? "Соберите первый набор" : "Create your first suite")}</h2>
      <p>{props.suites.length ? (ru ? "Попробуйте другое название или измените фильтр состава." : "Try another name or change the composition filter.") : (ru ? "Объедините кейсы, которые проверяете вместе, чтобы запускать их одним набором." : "Group cases you check together so they can be started as one suite.")}</p>
      {props.suites.length > 0 && <button type="button" className={shared.quiet} onClick={() => { props.onQuery(""); props.onFilter("all"); }}>{ru ? "Сбросить поиск и фильтр" : "Reset search and filter"}</button>}
    </div>}
    {rows.length > 0 && <footer className={styles.footer} aria-live="polite">{formatCount(locale, rows.length, ["suite", "suites"], ["сьют", "сьюта", "сьютов"])}</footer>}
  </>;
}

import { PiListChecks } from "react-icons/pi";
import { useEffect } from "react";
import { useNavigationValue } from "../../../../state/navigation/context/useNavigationValue";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { SelectionControls, useSelectionFilters } from "../../../cases/selection/controls/SelectionControls";
import { LifecycleBadge } from "../../../cases/list/CaseBadges";
import { PrioritySignal } from "../../../cases/list/priority/PrioritySignal";
import { SuiteFolderPath } from "../../shared/folder-path/SuiteFolderPath";
import shared from "../../suites.module.css";
import css from "../detail.module.css";

type Props = {
  suiteId: string; cases: TestCaseSummary[]; folders: readonly RepositoryFolder[]; projectName: string; ru: boolean;
  onOpen: (item: TestCaseSummary) => void;
};
export function SuiteRepository(props: Props) {
  const [saved, setSaved] = useNavigationValue<Parameters<typeof useSelectionFilters>[1]>(`suite:${props.suiteId}:repository`, {});
  const filters = useSelectionFilters(props.cases, saved);
  useEffect(() => {
    setSaved({ query: filters.query, qlQuery: filters.qlQuery, filters: filters.filters, facets: filters.facets });
  }, [filters.query, filters.qlQuery, filters.filters, filters.facets, setSaved]);
  const reset = () => {
    filters.setQuery(""); filters.setQlQuery("");
    filters.setFilters({ type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
    filters.setFacets({ folders: [], components: [] });
  };
  const priority = props.ru ? { low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический" } : { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
  return <section className={css.repository} aria-label={props.ru ? "Состав сьюта" : "Suite membership"}>
    <div className={css.repositoryHeader}>
      <h2>{props.ru ? "Тест-кейсы" : "Test cases"}<span>{filters.visible.length === props.cases.length ? props.cases.length : `${filters.visible.length} / ${props.cases.length}`}</span></h2>
      <div className={css.repositoryTools}><SelectionControls state={filters} ru={props.ru} repository /></div>
    </div>
    <ul className={css.cases}>{filters.visible.map(item => {
      const folder = props.folders.find(value => value.id === item.folderId && value.projectId === item.projectId && !value.archivedAt);
      const path = folder?.path ?? item.folderPath;
      return <li key={item.id}><button type="button" className={css.case} onClick={() => props.onOpen(item)} aria-label={`${item.key}: ${item.title}`}>
        <PiListChecks size={17} aria-hidden="true" />
        <span className={css.caseCopy}><strong title={item.title}>{item.title}</strong><span className={css.caseContext}><span>{item.key}</span>
          <SuiteFolderPath appearance={folder?.appearance} folderId={folder?.id} projectId={item.projectId} path={path} ru={props.ru} unavailable={Boolean(item.folderId && !folder)} />
        </span></span>
        {item.priority && <PrioritySignal priority={item.priority} label={priority[item.priority]} size={13} />}
        <span className={css.lifecycle}><LifecycleBadge locale={props.ru ? "ru" : "en"} lifecycle={item.lifecycle} archived={Boolean(item.archivedAt)} /></span>
      </button></li>;
    })}</ul>
    {!filters.visible.length && <div className={shared.empty}>
      <h2>{props.cases.length ? (props.ru ? "Кейсы не найдены" : "No matching cases") : (props.ru ? "В этом сьюте пока нет кейсов" : "No cases in this suite yet")}</h2>
      <p>{props.cases.length ? (props.ru ? "Измените поиск, QL-запрос или фильтры." : "Change the search, QL query, or filters.") : (props.ru ? "Настройте состав сьюта, чтобы добавить подходящие проверки." : "Configure membership to include the checks you need.")}</p>
      {props.cases.length > 0 && <button type="button" className={shared.quiet} onClick={reset}>{props.ru ? "Сбросить поиск и фильтры" : "Reset search and filters"}</button>}
    </div>}
  </section>;
}

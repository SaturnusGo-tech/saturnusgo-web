import { useEffect, useState } from "react";
import { useNavigationValue } from "../../../../state/navigation/context/useNavigationValue";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { casePriority } from "../../../../helpers/cases/caseRevision";
import { useSelectionFilters } from "../../../cases/selection/controls/SelectionControls";
import { RepositoryQueryControls } from "../../../cases/browser/controls/RepositoryQueryControls";
import { LifecycleBadge } from "../../../cases/list/CaseBadges";
import { PriorityIcon, priorityLabel } from "../../../common/properties/PriorityIcon";
import { SuiteFolderPath } from "../../shared/folder-path/SuiteFolderPath";
import shared from "../../suites.module.css";
import css from "../detail.module.css";

type Props = {
  suiteId: string; cases: TestCaseSummary[]; folders: readonly RepositoryFolder[]; projectName: string; ru: boolean;
  onOpen: (item: TestCaseSummary) => void;
};
export function SuiteRepository(props: Props) {
  const locale = props.ru ? "ru" : "en";
  const [saved, setSaved] = useNavigationValue<Parameters<typeof useSelectionFilters>[1]>(`suite:${props.suiteId}:repository`, {});
  const [filterOpen, setFilterOpen] = useState(false);
  const filters = useSelectionFilters(props.cases, saved);
  useEffect(() => {
    setSaved({ query: filters.query, qlQuery: filters.qlQuery, filters: filters.filters, facets: filters.facets });
  }, [filters.query, filters.qlQuery, filters.filters, filters.facets, setSaved]);
  const reset = () => {
    filters.setQuery(""); filters.setQlQuery("");
    filters.setFilters({ type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
    filters.setFacets({ folders: [], components: [] });
  };
  return <section className={css.repository} aria-label={props.ru ? "Состав сьюта" : "Suite membership"}>
    <div className={css.repositoryHeader}>
      <h2>{props.ru ? "Тест-кейсы" : "Test cases"}<span>{filters.visible.length === props.cases.length ? props.cases.length : `${filters.visible.length} / ${props.cases.length}`}</span></h2>
      <div className={css.repositoryTools}>
        <RepositoryQueryControls locale={locale} query={filters.query} onQuery={filters.setQuery} qlQuery={filters.qlQuery} onQlQuery={filters.setQlQuery}
          filters={filters.filters} onFilters={filters.setFilters} facets={filters.facets} onFacets={filters.setFacets}
          options={filters.options} tags={filters.options.tags} directory={filters.directory} filterOpen={filterOpen} onFilterOpen={setFilterOpen} />
      </div>
    </div>
    <ul className={css.cases} role="list">{filters.visible.map(item => {
      const folder = props.folders.find(value => value.id === item.folderId && value.projectId === item.projectId && !value.archivedAt);
      const path = folder?.path ?? item.folderPath;
      const unavailable = Boolean(item.folderId && !folder);
      const priority = casePriority(item);
      const label = priorityLabel(locale, priority);
      return <li key={item.id}><button type="button" className={css.case} onClick={() => props.onOpen(item)} aria-label={`${item.key}: ${item.title}`}>
        <span className={css.priority} title={label} role="img" aria-label={label}><PriorityIcon level={priority} empty="circle" size={15} /></span>
        <span className={css.caseCopy}>
          <strong title={item.title}>{item.title}</strong>
          {(unavailable || path.split("/").some(part => part.trim())) && <span className={css.casePath}>
            <SuiteFolderPath appearance={folder?.appearance} folderId={folder?.id} projectId={item.projectId} path={path} ru={props.ru} unavailable={unavailable} />
          </span>}
        </span>
        <span className={css.lifecycle}><LifecycleBadge locale={locale} lifecycle={item.lifecycle} archived={Boolean(item.archivedAt)} neutral /></span>
        <span className={css.caseKey} title={item.key}>{item.key}</span>
      </button></li>;
    })}</ul>
    {!filters.visible.length && <div className={shared.empty}>
      <h2>{props.cases.length ? (props.ru ? "Кейсы не найдены" : "No matching cases") : (props.ru ? "В этом сьюте пока нет кейсов" : "No cases in this suite yet")}</h2>
      <p>{props.cases.length ? (props.ru ? "Измените поиск, QL-запрос или фильтры." : "Change the search, QL query, or filters.") : (props.ru ? "Настройте состав сьюта, чтобы добавить подходящие проверки." : "Configure membership to include the checks you need.")}</p>
      {props.cases.length > 0 && <button type="button" className={shared.quiet} onClick={reset}>{props.ru ? "Сбросить поиск и фильтры" : "Reset search and filters"}</button>}
    </div>}
  </section>;
}

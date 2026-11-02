import { Document, Folder } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect } from "react";
import { useNavigationValue } from "../../../../state/navigation/context/useNavigationValue";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { SelectionControls, useSelectionFilters } from "../../../cases/selection/controls/SelectionControls";
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
  const lifecycle = props.ru ? { draft: "Черновик", ready: "Готов", deprecated: "Устарел" } : { draft: "Draft", ready: "Ready", deprecated: "Deprecated" };
  return <section className={css.repository} aria-label={props.ru ? "Состав сьюта" : "Suite membership"}>
    <div className={css.repositoryHeader}>
      <h2>{props.ru ? "Тест-кейсы" : "Test cases"}<span>{filters.visible.length === props.cases.length ? props.cases.length : `${filters.visible.length} / ${props.cases.length}`}</span></h2>
      <div className={css.repositoryTools}><SelectionControls state={filters} ru={props.ru} repository /></div>
    </div>
    <ul className={css.cases}>{filters.visible.map(item => {
      const folder = props.folders.find(value => value.id === item.folderId && value.projectId === item.projectId)?.path ?? item.folderPath;
      const path = folder && folder !== "/" ? `${props.projectName} / ${folder.replace(/^\/+/, "").replace(/\//g, " / ")}` : props.projectName;
      return <li key={item.id}><button type="button" className={css.case} onClick={() => props.onOpen(item)} aria-label={`${item.key}: ${item.title}`}>
        <Document width={20} height={20} aria-hidden="true" />
        <span className={css.caseCopy}><strong>{item.title}</strong><span className={css.caseContext}><span>{item.key}</span><span className={css.folder} title={path}><Folder width={13} height={13} aria-hidden="true" /><span>{path}</span></span></span></span>
        <span className={css.lifecycle}>{item.archivedAt ? (props.ru ? "В архиве" : "Archived") : lifecycle[item.lifecycle]}</span>
      </button></li>;
    })}</ul>
    {!filters.visible.length && <div className={shared.empty}><Document width={28} height={28} aria-hidden="true" />
      <h2>{props.cases.length ? (props.ru ? "Кейсы не найдены" : "No matching cases") : (props.ru ? "В этом сьюте пока нет кейсов" : "No cases in this suite yet")}</h2>
      <p>{props.cases.length ? (props.ru ? "Измените поиск, QL-запрос или фильтры." : "Change the search, QL query, or filters.") : (props.ru ? "Настройте состав сьюта, чтобы добавить подходящие проверки." : "Configure membership to include the checks you need.")}</p>
      {props.cases.length > 0 && <button type="button" className={shared.quiet} onClick={reset}>{props.ru ? "Сбросить поиск и фильтры" : "Reset search and filters"}</button>}
    </div>}
  </section>;
}

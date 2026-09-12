import { useEffect } from "react";
import { useNavigationValue } from "../../../../state/navigation/context/useNavigationValue";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { SelectionControls, useSelectionFilters } from "../../../cases/selection/controls/SelectionControls";
import { SelectionTree } from "../../../cases/selection/tree/SelectionTree";
import css from "../detail.module.css";

type Props = {
  suiteId: string; cases: TestCaseSummary[]; folders: readonly RepositoryFolder[]; projectName: string; ru: boolean;
  onOpen: (item: TestCaseSummary) => void;
};
const noSelection = new Set<string>();
export function SuiteRepository(props: Props) {
  const [saved, setSaved] = useNavigationValue<Parameters<typeof useSelectionFilters>[1]>(`suite:${props.suiteId}:repository`, {});
  const filters = useSelectionFilters(props.cases, saved);
  useEffect(() => {
    setSaved({ query: filters.query, qlQuery: filters.qlQuery, filters: filters.filters, facets: filters.facets });
  }, [filters.query, filters.qlQuery, filters.filters, filters.facets, setSaved]);
  return <section className={css.repository} aria-label={props.ru ? "Состав сьюта" : "Suite membership"}>
    <SelectionControls state={filters} ru={props.ru} />
    <SelectionTree cases={filters.visible} folders={props.folders} selected={noSelection} ru={props.ru}
      onToggle={() => {}} onScope={() => {}} onOpen={props.onOpen}
      heading={<><strong>{props.projectName}</strong><span>{filters.visible.length}</span></>} />
    {!filters.visible.length && <p className={css.rule}>{props.cases.length ? (props.ru ? "По этому запросу кейсов нет" : "No matching cases") : (props.ru ? "В этом наборе пока нет кейсов" : "This suite has no cases yet")}</p>}
  </section>;
}

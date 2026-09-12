import type { RepositoryFolder } from "../../folders/model/folder";
import { useEffect, useRef } from "react";
import { useNavigationValue } from "../../state/navigation/context/useNavigationValue";
import type { Suite, SuiteSummary, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { SuiteCatalogFilter, SuiteCatalogSort } from "../../suites/catalog/suite-catalog";
import { SuiteCatalog } from "./catalog/SuiteCatalog";
import { SuiteDetail } from "./detail/SuiteDetail";
import { useSuiteNavigation } from "./navigation/useSuiteNavigation";
import styles from "./suites.module.css";

type Props = {
  workspaceId: string; projectId: string; projectName: string;
  suites: SuiteSummary[]; cases: TestCaseSummary[]; folders: readonly RepositoryFolder[]; selectedDetail: Suite | null;
  detailError: boolean; onRetryDetail: () => void;
  canManage: boolean; canRun: boolean;
  onSelect: (id: string) => void; onCreate: () => void;
  onConfigure: (id: string) => void; onRun: (id: string) => void;
  onOpenCase: (testCase: TestCaseSummary) => void;
};

export function SuitesView(props: Props) {
  const scope = `suites:${props.workspaceId}:${props.projectId}`;
  const [query, setQuery] = useNavigationValue(`${scope}:query`, "");
  const [filter, setFilter] = useNavigationValue<SuiteCatalogFilter>(`${scope}:filter`, "all");
  const [sort, setSort] = useNavigationValue<SuiteCatalogSort>(`${scope}:sort`, "updated");
  const nav = useSuiteNavigation(props.workspaceId, props.projectId, props.onSelect);
  const container = useRef<HTMLDivElement>(null);
  const previous = useRef({ id: "", scroll: 0 });
  const open = (id: string) => {
    previous.current = { id, scroll: container.current?.scrollTop ?? 0 };
    nav.open(id);
  };
  useEffect(() => {
    if (nav.id) { container.current?.scrollTo(0, 0); return; }
    const frame = requestAnimationFrame(() => {
      if (!container.current) return;
      container.current.scrollTop = previous.current.scroll;
      container.current.querySelector<HTMLButtonElement>(`[data-suite-id="${CSS.escape(previous.current.id)}"] [data-open-suite]`)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [nav.id]);
  const suite = props.suites.find(item => item.id === nav.id);
  const detail = props.selectedDetail?.id === nav.id && props.selectedDetail.projectId === props.projectId ? props.selectedDetail : null;
  return <div ref={container} className={styles.workspace}>
    {nav.id ? <SuiteDetail suite={suite} detail={detail} cases={props.cases} folders={props.folders} projectName={props.projectName}
      error={props.detailError} onRetry={props.onRetryDetail} onBack={nav.back}
      canManage={props.canManage} canRun={props.canRun} onConfigure={props.onConfigure} onRun={props.onRun} onOpenCase={props.onOpenCase} />
      : <SuiteCatalog suites={props.suites} detail={props.selectedDetail} projectName={props.projectName}
        query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} sort={sort} onSort={setSort}
        canManage={props.canManage} canRun={props.canRun} onOpen={open} onRun={props.onRun} onCreate={props.onCreate} />}
  </div>;
}

import { ChevronDown, ChevronRight, FilePlus2, FolderKanban, FolderPlus, MoreHorizontal } from "lucide-react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { CaseFilters } from "../../../state/types/workspace";
import { TestCaseRepositoryTree } from "../repository/TestCaseRepositoryTree";
import styles from "../cases.module.css";

type Props = {
  groups: Array<[string, TestCaseSummary[]]>; collapsed: string[]; selectedFolder: string;
  selectedCaseId: string; filters: CaseFilters; menuOpen: boolean;
  onMenuOpen: () => void; onFilters: (filters: CaseFilters) => void;
  onToggleFolder: (folder: string) => void; onSelectFolder: (folder: string) => void;
  onSelectCase: (id: string) => void; onNew: (folder?: string) => void;
  onNewFolder: () => void; onNewProject: () => void;
  onCollapseAll: () => void; onExpandAll: () => void;
};

const resetFilters: CaseFilters = { priority: "all", lifecycle: "all", tag: "", includeArchived: false };

export function CaseRepositoryPanel(props: Props) {
  const { locale, t } = useTmsLocale();
  const ru = locale === "ru";
  const allCases = props.groups.flatMap(([, cases]) => cases);
  const defaultSelected = props.filters.priority === "all" && props.filters.lifecycle === "all" && !props.filters.tag && !props.filters.includeArchived;
  return <aside className={styles.repository} aria-label={ru ? "Репозиторий тест-кейсов" : "Test case repository"}>
    <div className={styles.repositoryTopbar}>
      <strong>{t("cases.title")}</strong>
      <button className={styles.primaryIconButton} onClick={() => props.onNew(props.selectedFolder)} title={t("cases.new")} aria-label={t("cases.new")} data-testid="new-case"><FilePlus2 size={16} /></button>
    </div>
    <nav className={styles.repositoryScroll}>
      <div className={styles.sectionLabel}>{ru ? "Сохранённые" : "Saved views"}</div>
      <button className={`${styles.savedView} ${defaultSelected ? styles.savedViewActive : ""}`} onClick={() => props.onFilters(resetFilters)}><span><FolderKanban size={15} />{ru ? "Все тест-кейсы" : "All test cases"}</span><small>{allCases.length}</small></button>
      <button className={`${styles.savedView} ${props.filters.lifecycle === "ready" ? styles.savedViewActive : ""}`} onClick={() => props.onFilters({ ...resetFilters, lifecycle: "ready" })}><span><span className={`${styles.viewDot} ${styles.readyDot}`} />{t("status.ready")}</span><small>{allCases.filter((item) => item.lifecycle === "ready").length}</small></button>
      <button className={`${styles.savedView} ${props.filters.priority === "critical" ? styles.savedViewActive : ""}`} onClick={() => props.onFilters({ ...resetFilters, priority: "critical" })}><span><span className={`${styles.viewDot} ${styles.criticalDot}`} />{t("priority.critical")}</span><small>{allCases.filter((item) => item.priority === "critical").length}</small></button>
      <div className={styles.repositoryHeading} data-case-popover-root>
        <span>{ru ? "Репозиторий" : "Repository"}</span>
        <span>
          <button onClick={props.onNewFolder} title={t("cases.createFolder")} aria-label={t("cases.createFolder")}><FolderPlus size={15} /></button>
          <button onClick={props.onMenuOpen} title={t("cases.repositoryActions")} aria-label={t("cases.repositoryActions")} aria-expanded={props.menuOpen} aria-controls="case-repository-menu"><MoreHorizontal size={16} /></button>
        </span>
        {props.menuOpen && <div className={styles.repositoryMenu} id="case-repository-menu" role="menu">
          <button role="menuitem" onClick={props.onNewProject}><FolderKanban size={15} />{t("cases.createProject")}</button>
          <button role="menuitem" onClick={props.onExpandAll}><ChevronDown size={15} />{t("cases.expandAll")}</button>
          <button role="menuitem" onClick={props.onCollapseAll}><ChevronRight size={15} />{t("cases.collapseAll")}</button>
        </div>}
      </div>
      <TestCaseRepositoryTree groups={props.groups} collapsed={props.collapsed} selectedFolder={props.selectedFolder} selectedCaseId={props.selectedCaseId} onToggleFolder={props.onToggleFolder} onSelectFolder={props.onSelectFolder} onSelectCase={props.onSelectCase} onNew={props.onNew} />
    </nav>
  </aside>;
}

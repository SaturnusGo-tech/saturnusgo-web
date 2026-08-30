import { useEffect, useMemo, useRef, useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { formatCount } from "../../localization/format/count";
import { SaturnLoader } from "../common/loading/SaturnLoader";
import { CaseDetailPanel } from "./detail/CaseDetailPanel";
import { CasesTable } from "./list/CasesTable";
import { CASE_REPOSITORY_MIN, useCaseRepositoryResize } from "./layout/useCaseRepositoryResize";
import { flattenCaseGroups, sortCaseRows } from "./model/caseListModel";
import { CaseRepositoryPanel } from "./toolbar/CaseRepositoryPanel";
import { CasesToolbar } from "./toolbar/CasesToolbar";
import type { CaseListRow, CaseSort, CaseSortKey, CasesViewProps } from "./types";
import styles from "./cases.module.css";

export function CasesView(props: CasesViewProps) {
  const { locale, languageTag, t } = useTmsLocale();
  const { revision } = props;
  const [filterOpen, setFilterOpen] = useState(false);
  const [repositoryMenuOpen, setRepositoryMenuOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [sort, setSort] = useState<CaseSort>({ key: "key", direction: "asc" });
  const workbenchRef = useRef<HTMLDivElement>(null);
  const repositoryResize = useCaseRepositoryResize(workbenchRef);
  const flatRows = useMemo(() => flattenCaseGroups(props.groups), [props.groups]);
  const rows = useMemo(() => sortCaseRows(flatRows, sort, languageTag), [flatRows, sort, languageTag]);
  const countLabel = formatCount(locale, rows.length, ["test case", "test cases"], ["тест-кейс", "тест-кейса", "тест-кейсов"]);

  useEffect(() => {
    function closeMenus(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setFilterOpen(false);
      setRepositoryMenuOpen(false);
    }
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest("[data-case-popover-root]")) return;
      setFilterOpen(false);
      setRepositoryMenuOpen(false);
    }
    window.addEventListener("keydown", closeMenus);
    window.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("keydown", closeMenus);
      window.removeEventListener("pointerdown", closeOutside);
    };
  }, []);

  function toggleSort(key: CaseSortKey) {
    setSort((current) => current.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "asc" });
  }

  function selectRow(row: CaseListRow) {
    if (row.folderPath !== props.selectedFolder) props.onSelectFolder(row.folderPath);
    props.onSelectCase(row.testCase.id);
    setMobileDetailOpen(true);
  }

  return <div ref={workbenchRef} style={repositoryResize.style} className={`${styles.workspace} ${repositoryResize.resizing ? styles.workspaceResizing : ""}`} data-testid="cases-view">
    <div className={styles.repositoryColumn}>
      <CaseRepositoryPanel
        groups={props.groups} collapsed={props.collapsed} selectedFolder={props.selectedFolder}
        selectedCaseId={props.selectedCaseId} filters={props.filters} menuOpen={repositoryMenuOpen}
        onMenuOpen={() => { setRepositoryMenuOpen((value) => !value); setFilterOpen(false); }}
        onFilters={props.onFilters} onToggleFolder={props.onToggleFolder}
        onSelectFolder={props.onSelectFolder} onSelectCase={(id) => { props.onSelectCase(id); setMobileDetailOpen(true); }}
        onNew={props.onNew} onNewFolder={props.onNewFolder}
        onNewProject={() => { setRepositoryMenuOpen(false); props.onNewProject(); }}
        onCollapseAll={() => { setRepositoryMenuOpen(false); props.onCollapseAll(); }}
        onExpandAll={() => { setRepositoryMenuOpen(false); props.onExpandAll(); }}
      />
    </div>
    <div
      {...repositoryResize.handleProps}
      className={styles.resizeHandle}
      role="separator"
      aria-label={locale === "ru" ? "Изменить ширину репозитория" : "Resize repository"}
      aria-orientation="vertical"
      aria-valuemin={CASE_REPOSITORY_MIN}
      aria-valuemax={320}
      aria-valuenow={repositoryResize.width}
      tabIndex={0}
    />
    <section className={styles.listPane} aria-label={locale === "ru" ? "Список тест-кейсов" : "Test case list"}>
      <CasesToolbar locale={locale} query={props.query} countLabel={countLabel} filters={props.filters} filterOpen={filterOpen} selectedFolder={props.selectedFolder} onQuery={props.onQuery} onFilters={props.onFilters} onFilterOpen={() => { setFilterOpen((value) => !value); setRepositoryMenuOpen(false); }} onNew={props.onNew} />
      <CasesTable locale={locale} rows={rows} selectedCaseId={props.selectedCaseId} sort={sort} onSort={toggleSort} onSelect={selectRow} onCreate={() => props.onNew(props.selectedFolder)} />
    </section>
    <aside className={`${styles.detailPanel} ${mobileDetailOpen ? styles.detailPanelMobileOpen : ""}`} aria-label={locale === "ru" ? "Детали тест-кейса" : "Test case details"}>
      {props.testCase && !revision ? <SaturnLoader pane label={t("common.loading")} testId="case-detail-loading" /> : <CaseDetailPanel locale={locale} languageTag={languageTag} testCase={props.testCase} revision={revision} linkIds={props.linkIds} activity={props.activity} selectedFolder={props.selectedFolder} onNew={props.onNew} onEdit={props.onEdit} onClone={props.onClone} onArchive={props.onArchive} onRunCase={props.onRunCase} onClose={() => setMobileDetailOpen(false)} />}
    </aside>
  </div>;
}

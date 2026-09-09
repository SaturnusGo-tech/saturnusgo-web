import type { RefObject } from "react";
import { RepositoryControls } from "../browser/controls/RepositoryControls";
import { CasesToolbar } from "../toolbar/CasesToolbar";
import { CasesTable } from "../list/CasesTable";
import { RepositoryFolders } from "../../../folders/presentation/tree/RepositoryFolders";
import type { useCasesViewController } from "../view/useCasesViewController";
import type { CasesViewProps } from "../types";
import type { TmsLocale } from "../../../localization/model/locale";
import styles from "../cases.module.css";

export function CasesRepositoryList({ props, view, locale, listPaneRef }: {
  props: CasesViewProps; view: ReturnType<typeof useCasesViewController>; locale: TmsLocale; listPaneRef: RefObject<HTMLElement | null>;
}) {
  const focusEditorActions = () => document.getElementById("case-editor-actions")?.focus();
  return <>
    {props.folders && <RepositoryFolders resource={props.folders} cases={view.matchingRows.map(({ testCase }) => testCase)} filtered={view.treeFiltered} selectionMode={view.selectionMode} includeArchived={props.filters.includeArchived} onArchiveChange={view.setRepositoryArchived}
      controls={<RepositoryControls props={props} view={view} locale={locale} />} selected={view.bulkSelection.selected}
      selectedFolder={props.selectedFolder} selectedFolderId={props.selectedFolderId} activeCaseId={props.selectedCaseId} ru={locale === "ru"} locked={Boolean(props.editor)}
      onToggle={view.bulkSelection.toggleOne} onScope={view.bulkSelection.toggleScope} onFolder={props.onSelectFolder}
      onCase={(item) => view.selectRow({ testCase: item, folderPath: item.folderPath })} onCreate={view.createCase}
      onNewFolder={props.onNewFolder} onImport={() => props.onImport?.()} />}
    {!props.folders && <section ref={listPaneRef} className={styles.listPane} data-bulk-active={view.bulkSelection.selectedIds.length > 0 || undefined} aria-label={locale === "ru" ? "Список тест-кейсов" : "Test case list"}>
      <CasesToolbar
        folderArchived={view.folderArchived}
        repositoryMode={Boolean(props.folders)}
        locale={locale}
        query={props.query}
        countLabel={view.countLabel}
        estimateLabel={view.estimateLabel}
        filters={props.filters}
        filterOpen={view.filterOpen}
        selectedFolder={props.selectedFolder}
        qlQuery={view.qlQuery}
        viewMode={view.viewMode}
        groupBy={view.groupBy}
        facetFilters={view.facetFilters}
        facetOptions={view.facetOptions}
        selectionMode={view.selectionMode}
        onQuery={props.onQuery}
        onQlQuery={view.setQlQuery}
        onViewMode={view.setViewMode}
        onGroupBy={view.setGroupBy}
        onFacetFilters={view.setFacetFilters}
        onSelectionMode={view.toggleSelectionMode}
        onFilters={props.onFilters}
        onFilterOpen={() => view.setFilterOpen((value) => !value)}
        onNew={view.createCase}
        onNewFolder={props.onNewFolder}
        interactionLocked={Boolean(props.editor)}
        onLockedInteraction={focusEditorActions}
      />
      <CasesTable
        folderEmpty={view.folderEmpty}
        folderArchived={view.folderArchived}
        repositoryEmpty={Boolean(props.folders) && !props.testCases.length}
        locale={locale}
        rows={view.rows}
        dragEnabled={false}
        selectedCaseId={props.selectedCaseId}
        sort={view.sort}
        viewMode={view.viewMode}
        groupBy={view.groupBy}
        interactionLocked={Boolean(props.editor)}
        onLockedInteraction={focusEditorActions}
        onSort={view.toggleSort}
        onSelect={view.selectRow}
        onCreate={() => view.createCase()}
        selectedIds={view.bulkSelection.selected}
        selectableIds={view.selectableIds}
        selectedCount={view.bulkSelection.selectedIds.length}
        selectableCount={view.selectableCount}
        visibleCoverage={view.bulkSelection.visibleCoverage}
        selectionMode={view.selectionMode}
        onToggleCase={view.bulkSelection.toggleOne}
        onToggleScope={view.bulkSelection.toggleScope}
        onSelectVisible={view.bulkSelection.selectVisible}
        onSelectAll={view.bulkSelection.selectAll}
        onClearSelection={view.bulkSelection.clear}
      />
    </section>}
  </>;
}

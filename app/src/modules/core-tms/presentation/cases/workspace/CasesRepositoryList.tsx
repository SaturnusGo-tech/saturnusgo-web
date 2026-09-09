import { useState, type RefObject } from "react";
import { CasesToolbar } from "../toolbar/CasesToolbar";
import { CasesTable } from "../list/CasesTable";
import { CaseBulkActionBar } from "../bulk/action/CaseBulkActionBar";
import { MAX_CASE_BULK_MUTATION_ITEMS } from "../../../../../core/tms/contracts/test-cases/bulk-case-contract";
import { RepositoryFolders } from "../../../folders/presentation/tree/RepositoryFolders";
import { MoveCasesDialog } from "../../../folders/presentation/dialog/MoveCasesDialog";
import { ArchiveCasesDialog } from "../../../folders/presentation/dialog/ArchiveCasesDialog";
import type { useCasesViewController } from "../view/useCasesViewController";
import type { CasesViewProps } from "../types";
import type { TmsLocale } from "../../../localization/model/locale";
import styles from "../cases.module.css";

export function CasesRepositoryList({ props, view, locale, listPaneRef }: {
  props: CasesViewProps; view: ReturnType<typeof useCasesViewController>; locale: TmsLocale; listPaneRef: RefObject<HTMLElement | null>;
}) {
  const [action, setAction] = useState<"move" | "archive" | null>(null);
  const [error, setError] = useState("");
  const focusEditorActions = () => document.getElementById("case-editor-actions")?.focus();
  async function removeFromFolder() {
    const result = await props.folders?.moveCases(view.bulkSelection.selectedIds, null);
    if (result?.ok) view.bulkSelection.clear(); else if (result) setError(result.message);
  }
  return <>
    {props.folders && <RepositoryFolders resource={props.folders} cases={props.testCases} selected={view.bulkSelection.selected}
      selectedFolder={props.selectedFolder} selectedFolderId={props.selectedFolderId} activeCaseId={props.selectedCaseId} ru={locale === "ru"} locked={Boolean(props.editor)}
      onToggle={view.bulkSelection.toggleOne} onScope={view.bulkSelection.toggleScope} onFolder={props.onSelectFolder}
      onCase={(item) => view.selectRow({ testCase: item, folderPath: item.folderPath })} onCreate={view.createCase}
      onNewFolder={props.onNewFolder} onImport={() => props.onImport?.()} />}
    <section ref={listPaneRef} className={styles.listPane} data-bulk-active={view.bulkSelection.selectedIds.length > 0 || undefined} aria-label={locale === "ru" ? "Список тест-кейсов" : "Test case list"}>
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
        interactionLocked={Boolean(props.editor) || props.folders?.busy}
        onLockedInteraction={focusEditorActions}
      />
      <CasesTable
        folderEmpty={view.folderEmpty}
        folderArchived={view.folderArchived}
        repositoryEmpty={Boolean(props.folders) && !props.testCases.length}
        locale={locale}
        rows={view.rows}
        dragEnabled={props.folders?.canManage && !props.folders.busy}
        selectedCaseId={props.selectedCaseId}
        sort={view.sort}
        viewMode={view.viewMode}
        groupBy={view.groupBy}
        interactionLocked={Boolean(props.editor) || props.folders?.busy}
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
      {view.bulkSelection.selectedIds.length > 0 && !props.editor && <CaseBulkActionBar
        locale={locale}
        selectedCount={view.bulkSelection.selectedIds.length}
        onMove={props.folders?.canManage ? () => setAction("move") : undefined}
        onRemove={props.folders?.canManage ? () => void removeFromFolder() : undefined}
        onArchive={props.folders?.canManage ? () => setAction("archive") : undefined}
        externalBusy={props.folders?.busy}
        mutationLimit={MAX_CASE_BULK_MUTATION_ITEMS}
        mutationEnabled={props.bulkMutationEnabled}
        onClear={view.bulkSelection.clear}
        onCreateRun={() => props.onRunCases(view.bulkSelection.selectedIds)}
        onChangeLifecycle={(value) => props.onBulkChangeLifecycle(view.bulkSelection.selectedIds, value)}
        onChangePriority={(value) => props.onBulkChangePriority(view.bulkSelection.selectedIds, value)}
      />}
    </section>
    {error && <p role="alert">{error}</p>}
    {props.folders && action === "move" && <MoveCasesDialog resource={props.folders} ids={view.bulkSelection.selectedIds} ru={locale === "ru"}
      onClose={() => setAction(null)} onMoved={view.bulkSelection.clear} />}
    {props.folders && action === "archive" && <ArchiveCasesDialog resource={props.folders} ids={view.bulkSelection.selectedIds} ru={locale === "ru"}
      onClose={() => setAction(null)} onArchived={view.bulkSelection.clear} />}
  </>;
}

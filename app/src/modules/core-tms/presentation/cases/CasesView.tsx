import { useEffect, useRef } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { CaseDetailPanel } from "./detail/CaseDetailPanel";
import { CasesTable } from "./list/CasesTable";
import {
  CASE_INSPECTOR_MAX,
  CASE_INSPECTOR_MIN,
} from "./split/useCaseInspectorResize";
import { CasesToolbar } from "./toolbar/CasesToolbar";
import { CaseBulkActionBar } from "./bulk/action/CaseBulkActionBar";
import type { CasesViewProps } from "./types";
import { useCasesViewController } from "./view/useCasesViewController";
import styles from "./cases.module.css";
import { MAX_CASE_BULK_MUTATION_ITEMS } from "../../../../core/tms/contracts/test-cases/bulk-case-contract";

export function CasesView(props: CasesViewProps) {
  const { locale, languageTag, t } = useTmsLocale();
  const view = useCasesViewController(props, locale, languageTag);
  const detailPanelRef = useRef<HTMLElement>(null);
  const listPaneRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const focusEditorActions = () => document.getElementById("case-editor-actions")?.focus();

  useEffect(() => {
    if (!view.inspectorOpen || !view.inspectorResize.overlay) return;
    const panel = detailPanelRef.current;
    const list = listPaneRef.current;
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    if (list) list.inert = true;
    panel?.focus();
    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hidden && element.getClientRects().length > 0);
      if (!focusable.length) { event.preventDefault(); panel.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    window.addEventListener("keydown", trapFocus);
    return () => {
      window.removeEventListener("keydown", trapFocus);
      if (list) list.inert = false;
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (target?.isConnected) requestAnimationFrame(() => target.focus());
    };
  }, [view.inspectorOpen, view.inspectorResize.overlay]);

  return <div
    ref={view.workspaceRef}
    style={view.inspectorResize.style}
    className={`${styles.workspace} ${view.inspectorResize.resizing ? styles.workspaceResizing : ""}`}
    data-testid="cases-view"
  >
    <section ref={listPaneRef} className={styles.listPane} data-bulk-active={view.bulkSelection.selectedIds.length > 0 || undefined} aria-label={locale === "ru" ? "Список тест-кейсов" : "Test case list"}>
      <CasesToolbar
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
        onQuery={props.onQuery}
        onQlQuery={view.setQlQuery}
        onViewMode={view.setViewMode}
        onGroupBy={view.setGroupBy}
        onFacetFilters={view.setFacetFilters}
        onFilters={props.onFilters}
        onFilterOpen={() => view.setFilterOpen((value) => !value)}
        onNew={view.createCase}
        onNewFolder={props.onNewFolder}
        interactionLocked={Boolean(props.editor)}
        onLockedInteraction={focusEditorActions}
      />
      <CasesTable
        locale={locale}
        rows={view.rows}
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
        onToggleCase={view.bulkSelection.toggleOne}
        onToggleScope={view.bulkSelection.toggleScope}
        onSelectVisible={view.bulkSelection.selectVisible}
        onSelectAll={view.bulkSelection.selectAll}
        onClearSelection={view.bulkSelection.clear}
      />
      {view.bulkSelection.selectedIds.length > 0 && !props.editor && <CaseBulkActionBar
        locale={locale}
        selectedCount={view.bulkSelection.selectedIds.length}
        mutationLimit={MAX_CASE_BULK_MUTATION_ITEMS}
        mutationEnabled={props.bulkMutationEnabled}
        onClear={view.bulkSelection.clear}
        onCreateRun={() => props.onRunCases(view.bulkSelection.selectedIds)}
        onChangeLifecycle={(value) => props.onBulkChangeLifecycle(view.bulkSelection.selectedIds, value)}
        onChangePriority={(value) => props.onBulkChangePriority(view.bulkSelection.selectedIds, value)}
      />}
    </section>
    {view.inspectorOpen && !view.detailFullscreen && <div
      {...view.inspectorResize.handleProps}
      className={styles.detailResizeHandle}
      role="separator"
      aria-label={locale === "ru" ? "Изменить ширину инспектора" : "Resize inspector"}
      aria-orientation="vertical"
      aria-valuemin={CASE_INSPECTOR_MIN}
      aria-valuemax={CASE_INSPECTOR_MAX}
      aria-valuenow={view.inspectorResize.width}
      tabIndex={0}
    />}
    {view.inspectorOpen && <button type="button" className={styles.detailScrim} onClick={view.closeInspector} aria-label={locale === "ru" ? "Закрыть тест-кейс" : "Close test case"} />}
    {view.inspectorOpen && <aside
      ref={detailPanelRef}
      id="case-detail-panel"
      className={`${styles.detailPanel} ${styles.detailPanelOpen} ${view.detailFullscreen ? styles.detailPanelFullscreen : ""}`}
      role={view.inspectorResize.overlay ? "dialog" : "complementary"}
      aria-modal={view.inspectorResize.overlay || undefined}
      aria-label={locale === "ru" ? "Тест-кейс" : "Test case"}
      tabIndex={view.inspectorResize.overlay ? -1 : undefined}
    >
      {!props.editor && props.testCase && !props.revision
        ? props.detailLoadError
          ? <div className={styles.detailEmpty} role="alert" data-testid="case-detail-error">
              <strong>{locale === "ru" ? "Не удалось загрузить тест-кейс" : "Could not load the test case"}</strong>
              <span>{locale === "ru" ? "Проверьте подключение и повторите загрузку." : "Check the connection and try loading it again."}</span>
              <button type="button" className={styles.secondaryButton} onClick={props.onRetryDetail}>
                {locale === "ru" ? "Повторить" : "Retry"}
              </button>
            </div>
          : <TessiqLoader pane label={t("common.loading")} testId="case-detail-loading" />
        : <CaseDetailPanel
            locale={locale}
            languageTag={languageTag}
            testCase={props.testCase}
            revision={props.editor?.value ?? props.revision}
            editor={props.editor}
            linkIds={props.linkIds}
            activity={props.activity}
            selectedFolder={props.selectedFolder}
            onNew={view.createCase}
            onEdit={props.onEdit}
            onClone={props.onClone}
            onArchive={props.onArchive}
            onRunCase={props.onRunCase}
            fullscreen={view.detailFullscreen}
            onToggleFullscreen={() => view.setDetailFullscreen((current) => !current)}
            onClose={view.closeInspector}
          />}
    </aside>}
  </div>;
}

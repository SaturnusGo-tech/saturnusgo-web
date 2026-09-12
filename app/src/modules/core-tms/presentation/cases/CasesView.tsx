import { useCaseBrowserFocus } from "./browser/layout/useCaseBrowserFocus";
import { CasesSelectionActions } from "./browser/selection/CasesSelectionActions";
import { CaseBrowserEmpty } from "./browser/layout/CaseBrowserEmpty";
import browser from "./browser/layout/browser.module.css";
import { CasesRepositoryList } from "./workspace/CasesRepositoryList";
import { RepositoryDragContext } from "../../folders/presentation/dnd/RepositoryDragContext";
import { useEffect, useRef } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { CaseDetailPanel } from "./detail/CaseDetailPanel";
import {
  CASE_INSPECTOR_MAX,
  CASE_INSPECTOR_MIN,
} from "./split/useCaseInspectorResize";
import type { CasesViewProps } from "./types";
import { useCasesViewController } from "./view/useCasesViewController";
import styles from "./cases.module.css";

export function CasesView(props: CasesViewProps) {
  const { locale, languageTag, t } = useTmsLocale();
  const view = useCasesViewController(props, locale, languageTag);
  const detailPanelRef = useRef<HTMLElement>(null);
  const listPaneRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const captureBrowserFocus = useCaseBrowserFocus(Boolean(props.folders), view.inspectorOpen, view.detailFullscreen, view.workspaceRef, detailPanelRef);

  useEffect(() => {
    if (props.folders || !view.inspectorOpen || !view.inspectorResize.overlay) return;
    const panel = detailPanelRef.current;
    const list = listPaneRef.current;
    const tree = view.workspaceRef.current?.querySelector<HTMLElement>("[data-repository-tree]");
    const visible = Boolean(panel?.getClientRects().length);
    returnFocusRef.current = visible && document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    if (list) list.inert = true;
    if (tree) tree.inert = true;
    if (visible) panel?.focus();
    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab" || !panel?.getClientRects().length) return;
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
      if (tree) tree.inert = false;
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (target?.isConnected) requestAnimationFrame(() => {
        if (target.isConnected && target.getClientRects().length) target.focus();
      });
    };
  }, [props.folders, view.inspectorOpen, view.inspectorResize.overlay]);

  const content = <div
    ref={view.workspaceRef}
    onFocusCapture={captureBrowserFocus}
    style={view.inspectorResize.style}
    className={`${styles.workspace} ${props.folders ? browser.browser : ""} ${view.inspectorResize.resizing ? styles.workspaceResizing : ""}`}
    data-bulk-active={view.bulkSelection.selectedIds.length > 0 || undefined}
    data-testid="cases-view"
  >
    <div className={props.folders ? browser.panes : undefined} style={props.folders ? undefined : { display: "contents" }} data-open={view.inspectorOpen || undefined} data-fullscreen={view.detailFullscreen || undefined}>
    {props.repository ?? <CasesRepositoryList props={props} view={view} locale={locale} listPaneRef={listPaneRef} />}
    {!props.folders && view.inspectorOpen && !view.detailFullscreen && <div
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
    {!props.folders && view.inspectorOpen && <button type="button" className={styles.detailScrim} onClick={view.closeInspector} aria-label={locale === "ru" ? "Закрыть тест-кейс" : "Close test case"} />}
    {(props.folders || view.inspectorOpen) && <aside
      ref={detailPanelRef}
      id="case-detail-panel"
      className={`${styles.detailPanel} ${props.folders ? browser.detail : styles.detailPanelOpen} ${!props.folders && view.detailFullscreen ? styles.detailPanelFullscreen : ""}`}
      role={!props.folders && view.inspectorResize.overlay ? "dialog" : "complementary"}
      aria-modal={(!props.folders && view.inspectorResize.overlay) || undefined}
      aria-label={locale === "ru" ? "Тест-кейс" : "Test case"}
      tabIndex={props.folders || view.inspectorResize.overlay ? -1 : undefined}
    >
      {props.folders && !view.inspectorOpen ? <CaseBrowserEmpty ru={locale === "ru"} /> : !props.editor && props.testCase && !props.revision
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
            collaboration={props.collaboration}
            onOpenDefect={props.onOpenDefect}
            sharedSteps={props.sharedSteps}
            onResolveSharedStep={props.onResolveSharedStep}
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
    </div>
    <CasesSelectionActions props={props} view={view} locale={locale} />
  </div>;
  return props.folders ? <RepositoryDragContext resource={props.folders} selected={view.bulkSelection.selected} ru={locale === "ru"} locked={Boolean(props.editor) || props.folders.busy}>{content}</RepositoryDragContext> : content;
}

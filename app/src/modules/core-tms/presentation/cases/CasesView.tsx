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

  useEffect(() => {
    if (!view.inspectorOpen || !view.inspectorResize.overlay) return;
    const panel = detailPanelRef.current;
    const list = listPaneRef.current;
    const tree = view.workspaceRef.current?.querySelector<HTMLElement>("[data-repository-tree]");
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    if (list) list.inert = true;
    if (tree) tree.inert = true;
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
      if (tree) tree.inert = false;
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (target?.isConnected) requestAnimationFrame(() => target.focus());
    };
  }, [view.inspectorOpen, view.inspectorResize.overlay]);

  const content = <div
    ref={view.workspaceRef}
    style={view.inspectorResize.style}
    className={`${styles.workspace} ${view.inspectorResize.resizing ? styles.workspaceResizing : ""}`}
    data-testid="cases-view"
  >
    <CasesRepositoryList props={props} view={view} locale={locale} listPaneRef={listPaneRef} />
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
  </div>;
  return props.folders ? <RepositoryDragContext resource={props.folders} selected={view.bulkSelection.selected} ru={locale === "ru"} locked={Boolean(props.editor) || props.folders.busy}>{content}</RepositoryDragContext> : content;
}

import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { ProductDocRunInspector } from "../presentation/run/inspector/ProductDocRunInspector";
import type { ProductDocRunSelection } from "../state/run/inspector/useProductDocRunModel";
import type { Activity } from "../../../../core/tms/contracts/legacy-contract";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import type { DraftProductDocRequirement, ProductDocsApi, ProductDocScope, ProductDocSelection } from "../domain/product-docs";
import { ProductDocsView } from "../presentation/ProductDocsView";
import { ProductDocsPanel } from "../presentation/panel/ProductDocsPanel";
import { readProductDocSelection, writeProductDocSelection } from "../navigation/product-doc-link";
import { HISTORY_CHANGE, navigateWorkspace, visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { buildWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";
import { ProductDocCasePanel } from "../presentation/panel/case/ProductDocCasePanel";
import { ProductDocsContext } from "./context/ProductDocsContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { ProductDocDraftBuffer } from "../state/draft/draft-buffer";

function subscribe(listener: () => void) {
  window.addEventListener(HISTORY_CHANGE, listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener(HISTORY_CHANGE, listener);
    window.removeEventListener("popstate", listener);
  };
}

export function ProductDocsWorkspace({api, scope, children, visible, enabled, projectName, contentRef, fallback, onOpenDefect, onCreateCase, activity, workspace}: {
  api: ProductDocsApi | null;
  workspace: WorkspaceModel;
  scope: ProductDocScope;
  enabled: boolean;
  children: ReactNode;
  visible: boolean;
  projectName?: string;
  fallback?: ReactNode;
  onOpenDefect?(id: string): void;
  onCreateCase?(requirement: DraftProductDocRequirement): void;
  activity?: Activity[];
  contentRef: RefObject<HTMLDivElement | null>;
}) {
  const {locale} = useTmsLocale();
  const drafts = useRef<ProductDocDraftBuffer>(new Map());
  useEffect(() => {
    if (!enabled && !drafts.current.size) return;
    function warn(event: BeforeUnloadEvent) {
      if (!drafts.current.size) return;
      event.preventDefault();
      event.returnValue = true;
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [enabled]);
  const href = useSyncExternalStore(subscribe, () => window.location.href, () => "");
  const [panel, setPanel] = useState<{scope: ProductDocScope; href: string; selection: ProductDocSelection; trigger: HTMLElement}>();
  const [casePanel, setCasePanel] = useState<{href: string; id: string; trigger?: HTMLElement}>();
  const [runPanel, setRunPanel] = useState<{href: string; selection: ProductDocRunSelection}>();
  const selectedRun = runPanel?.href === href ? runPanel.selection : undefined;
  const selectedCase = casePanel?.href === href ? casePanel : undefined;
  const currentPanel = panel?.scope === scope && panel.href === href ? panel : undefined;
  function select(selection?: ProductDocSelection) {
    const current = window.location.href;
    const url = new URL(buildWorkspaceDeepLink(current, {...scope, view: "product-docs", runId: null}));
    const next = writeProductDocSelection(url, selection).href;
    if (visible) navigateWorkspace(next);
    else visitWorkspace(next);
  }
  function openCase(caseId: string, trigger?: HTMLElement) {
    setRunPanel(undefined);
    setCasePanel({href, id: caseId, trigger});
  }
  function openDocument(selection: ProductDocSelection, trigger: HTMLElement) {
    setCasePanel(undefined);
    setRunPanel(undefined);
    setPanel({scope, href, selection, trigger});
  }
  function openRun(selection: ProductDocRunSelection) { setRunPanel({href, selection}); }
  const context = api && enabled ? {api, scope, openCase, openDocument, openRun, open: openDocument} : null;
  return <ProductDocsContext.Provider value={context}>
    {visible ? (context ? <ProductDocsView api={context.api} scope={scope} locale={locale} projectName={projectName} drafts={drafts.current}
      selection={href ? readProductDocSelection(href) : undefined} onSelect={select} onCreateCase={onCreateCase} onOpenCase={({caseId}) => openCase(caseId, document.activeElement instanceof HTMLElement ? document.activeElement : undefined)} /> : fallback) : children}
    {context && <ProductDocsPanel api={context.api} scope={scope} locale={locale} projectName={projectName} selection={currentPanel?.selection} trigger={currentPanel?.trigger}
      contentRef={contentRef} onClose={() => setPanel(undefined)}
      onOpenFull={(selection: ProductDocSelection) => { setPanel(undefined); select(selection); }} />}
    {context && <ProductDocCasePanel caseId={selectedCase?.id} trigger={selectedCase?.trigger} scope={scope}
      contentRef={contentRef} projectName={projectName} activity={activity} onClose={() => setCasePanel(undefined)} onOpenDefect={onOpenDefect} />}
    {context && <ProductDocRunInspector selection={selectedRun} workspace={workspace} contentRef={contentRef}
      onClose={() => setRunPanel(undefined)} />}
  </ProductDocsContext.Provider>;
}

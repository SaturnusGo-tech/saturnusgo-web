import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import type { ProductDocsApi, ProductDocScope, ProductDocSelection } from "../domain/product-docs";
import { ProductDocsView } from "../presentation/ProductDocsView";
import { ProductDocsPanel } from "../presentation/panel/ProductDocsPanel";
import { readProductDocSelection, writeProductDocSelection } from "../navigation/product-doc-link";
import { HISTORY_CHANGE, navigateWorkspace, visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { buildWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";
import { buildCaseDeepLink } from "../../test-cases/navigation/case-deep-link";
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

export function ProductDocsWorkspace({api, scope, children, visible, enabled, projectName, contentRef, fallback}: {
  api: ProductDocsApi | null;
  scope: ProductDocScope;
  enabled: boolean;
  children: ReactNode;
  visible: boolean;
  projectName?: string;
  fallback?: ReactNode;
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
  const currentPanel = panel?.scope === scope && panel.href === href && !visible ? panel : undefined;
  function select(selection?: ProductDocSelection) {
    const current = window.location.href;
    const url = new URL(buildWorkspaceDeepLink(current, {...scope, view: "product-docs", runId: null}));
    const next = writeProductDocSelection(url, selection).href;
    if (visible) navigateWorkspace(next);
    else visitWorkspace(next);
  }
  function openCase({caseId}: {caseId: string}) {
    visitWorkspace(buildCaseDeepLink(window.location.href, {...scope, caseId}));
  }
  const context = api && enabled ? {api, scope, open: (selection: ProductDocSelection, trigger: HTMLElement) => setPanel({scope, href, selection, trigger})} : null;
  return <ProductDocsContext.Provider value={context}>
    {visible ? (context ? <ProductDocsView api={context.api} scope={scope} locale={locale} projectName={projectName} drafts={drafts.current}
      selection={href ? readProductDocSelection(href) : undefined} onSelect={select} onOpenCase={openCase} /> : fallback) : children}
    {context && <ProductDocsPanel api={context.api} scope={scope} locale={locale} selection={currentPanel?.selection} trigger={currentPanel?.trigger}
      contentRef={contentRef} onClose={() => setPanel(undefined)}
      onOpenFull={(selection: ProductDocSelection) => { setPanel(undefined); select(selection); }} />}
  </ProductDocsContext.Provider>;
}

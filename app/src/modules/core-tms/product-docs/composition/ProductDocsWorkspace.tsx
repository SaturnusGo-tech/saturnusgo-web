import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import { ProductDocRunInspector } from "../presentation/run/inspector/ProductDocRunInspector";
import type { ProductDocRunSelection } from "../state/run/inspector/useProductDocRunModel";
import type { Activity } from "../../../../core/tms/contracts/legacy-contract";
import { useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import type { DraftProductDocRequirement, ProductDocsApi, ProductDocScope, ProductDocSelection } from "../domain/product-docs";
import { ProductDocsView } from "../presentation/ProductDocsView";
import { ProductDocsPanel } from "../presentation/panel/ProductDocsPanel";
import { readProductDocSelection, writeProductDocSelection } from "../navigation/product-doc-link";
import { HISTORY_CHANGE, navigateWorkspace, visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { buildWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";
import { ProductDocCasePanel } from "../presentation/panel/case/ProductDocCasePanel";
import { ProductDocsContext } from "./context/ProductDocsContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useProductDocDraftSession } from "../state/draft/session/useProductDocDraftSession";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { requestAuthoringLeave } from "../../authoring/leave/application/authoring-leave";
import type { ProductDocRepositoryTarget } from "../navigation/product-doc-smart-link";
import { ProductDocRepositoryPanel } from "../presentation/panel/repository/ProductDocRepositoryPanel";
import { CaseReferenceProvider } from "../../case-references/presentation/CaseReferenceProvider";

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
  const session = useOptionalTmsSession();
  const drafts = useProductDocDraftSession({ api, scope, enabled, locale, ownerId: session?.subject ?? null, notify: workspace.notify });
  const href = useSyncExternalStore(subscribe, () => window.location.href, () => "");
  const [panel, setPanel] = useState<{scope: ProductDocScope; href: string; selection: ProductDocSelection; trigger: HTMLElement}>();
  const [casePanel, setCasePanel] = useState<{href: string; id: string; scope: ProductDocScope; trigger?: HTMLElement}>();
  const [repositoryPanel, setRepositoryPanel] = useState<{href: string; target: ProductDocRepositoryTarget; trigger: HTMLElement}>();
  const [runPanel, setRunPanel] = useState<{href: string; selection: ProductDocRunSelection}>();
  const selectedRun = runPanel?.href === href ? runPanel.selection : undefined;
  const selectedCase = casePanel?.href === href ? casePanel : undefined;
  const currentPanel = panel?.scope === scope && panel.href === href ? panel : undefined;
  function documentHref(selection?: ProductDocSelection) {
    const url = new URL(buildWorkspaceDeepLink(window.location.href, {...scope, view: "product-docs", runId: null}));
    return writeProductDocSelection(url, selection).href;
  }
  function select(selection?: ProductDocSelection) {
    const next = documentHref(selection);
    return requestAuthoringLeave(() => visible ? navigateWorkspace(next) : visitWorkspace(next));
  }
  function openCase(caseId: string, trigger?: HTMLElement, selection?: ProductDocSelection, projectId = scope.projectId) {
    setRunPanel(undefined);
    setRepositoryPanel(undefined);
    setCasePanel({href: selection ? documentHref(selection) : href, id: caseId, scope: projectId === scope.projectId ? scope : {...scope, projectId}, trigger});
    if (selection) select(selection);
  }
  function openDocument(selection: ProductDocSelection, trigger: HTMLElement) {
    setCasePanel(undefined);
    setRunPanel(undefined);
    setRepositoryPanel(undefined);
    setPanel({scope, href, selection, trigger});
  }
  function openRepository(target: ProductDocRepositoryTarget, trigger: HTMLElement) {
    setCasePanel(undefined);
    setRunPanel(undefined);
    setRepositoryPanel({href, target, trigger});
  }
  function openRun(selection: ProductDocRunSelection) { setRunPanel({href, selection}); }
  const context = api && enabled ? {api, scope, openCase: (id: string, trigger: HTMLElement, projectId?: string) => openCase(id, trigger, undefined, projectId),
    openRepository, openDocument, openRun, open: openDocument} : null;
  const referenceProjects = workspace.data.projects.map(project => project.id);
  return <ProductDocsContext.Provider value={context}>
    <CaseReferenceProvider scope={scope} records={workspace.data.testCases} projectIds={referenceProjects}>
    {visible ? (context ? <ProductDocsView api={context.api} scope={scope} locale={locale} projectName={projectName} drafts={drafts}
      selection={href ? readProductDocSelection(href) : undefined} onSelect={select} onCreateCase={onCreateCase}
      onOpenCase={({caseId}, selection) => openCase(caseId, document.activeElement instanceof HTMLElement ? document.activeElement : undefined, selection)} /> : fallback) : children}
    {context && <ProductDocsPanel api={context.api} scope={scope} locale={locale} projectName={projectName} selection={currentPanel?.selection} trigger={currentPanel?.trigger}
      contentRef={contentRef} onClose={() => setPanel(undefined)}
      onOpenFull={(selection: ProductDocSelection) => select(selection)} />}
    {context && <ProductDocRepositoryPanel target={repositoryPanel?.href === href ? repositoryPanel.target : undefined} scope={scope}
      trigger={repositoryPanel?.trigger} onClose={() => setRepositoryPanel(undefined)}
      onCase={(id, trigger, projectId) => openCase(id, trigger, undefined, projectId)} />}
    {context && <CaseReferenceProvider scope={selectedCase?.scope ?? scope} records={workspace.data.testCases} projectIds={referenceProjects}>
      <ProductDocCasePanel caseId={selectedCase?.id} trigger={selectedCase?.trigger} scope={selectedCase?.scope ?? scope}
        contentRef={contentRef} projectName={selectedCase?.scope.projectId === scope.projectId ? projectName
          : workspace.data.projects.find(project => project.id === selectedCase?.scope.projectId)?.name}
        activity={activity} onClose={() => setCasePanel(undefined)} onOpenDefect={selectedCase?.scope.projectId === scope.projectId ? onOpenDefect : undefined} />
    </CaseReferenceProvider>}
    {context && <ProductDocRunInspector selection={selectedRun} workspace={workspace} contentRef={contentRef}
      onClose={() => setRunPanel(undefined)} />}
    </CaseReferenceProvider>
  </ProductDocsContext.Provider>;
}

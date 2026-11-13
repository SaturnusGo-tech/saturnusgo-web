"use client";

import { requestAuthoringLeave } from "../../../../authoring/leave/application/authoring-leave";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useOptionalTmsSession } from "../../../../auth/presentation/session/TmsSessionContext";
import { emptyProductDocTaxonomy } from "../../../domain/product-doc-taxonomy";
import type { ProductDocNode, ProductDocSelection } from "../../../domain/product-docs";
import { useProductDocDraftRoute } from "../../../state/draft/useProductDocDraftRoute";
import { productDocsCopy } from "../../../localization/copy";
import { useProductDocAncestors } from "../../../state/tree/useProductDocAncestors";
import { useProductDocList } from "../../../state/tree/useProductDocList";
import { useProductDocSelection } from "../../../state/useProductDocSelection";
import { useProductDocsLibrary, type ProductDocsShelf } from "../../../state/library/useProductDocsLibrary";
import { ReadState } from "../../status/ReadState";
import { RelatedCases } from "../../article/RelatedCases";
import type { RequestNewProductDoc } from "../../draft/ProductDocDraft";
import { ProductDocsLibraryBar } from "../../library/ProductDocsLibraryBar";
import { ProductDocsStructure } from "../../structure/ProductDocsStructure";
import { CreateProductDoc } from "../../toolbar/CreateProductDoc";
import { ProductDocActions } from "../../toolbar/actions/ProductDocActions";
import { ProductDocSubdocs } from "../../tree/sections/ProductDocSubdocs";
import { ProductDocsShelfContents } from "../../tree/shelf/ProductDocsShelfContents";
import { ProductDocsTree } from "../../tree/ProductDocsTree";
import { ProductDocsTreeControls } from "../../tree/controls/ProductDocsTreeControls";
import { ProductDocsSelectedPage } from "../ProductDocsSelectedPage";
import { ProductDocsWorkspaceHeader } from "../ProductDocsWorkspaceHeader";
import styles from "../../product-docs.module.css";
import type { ProductDocsViewProps } from "./model/product-docs-view-props";
import { useProductDocLifecycle } from "../../../state/lifecycle/useProductDocLifecycle";

export function ProjectDocumentation({ api, scope, locale, projectName, drafts, selection, onSelect, onOpenCase, onCreateCase }: ProductDocsViewProps) {
  const copy = productDocsCopy(locale);
  const newPageLabel = locale === "ru" ? "Новая статья" : "New article";
  const { routeKey, editor, explicitDraft, setEditor } = useProductDocDraftRoute(scope, selection, drafts);
  const [treeOpen, setTreeOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [search, setSearch] = useState({ query: "", taxonomy: emptyProductDocTaxonomy });
  const clearSearch = () => setSearch({ query: "", taxonomy: emptyProductDocTaxonomy });
  const [shelf, setShelf] = useState<ProductDocsShelf>("overview");
  const [treeRefresh, setTreeRefresh] = useState(0);
  const [docRefresh, setDocRefresh] = useState(0);
  const articleRoot = useRef<HTMLDivElement>(null);
  const editorActionsRef = useRef<HTMLDivElement>(null);
  const requestNewPage = useRef<RequestNewProductDoc>(null);
  const openingPage = useRef<string>(undefined), structureButton = useRef<HTMLButtonElement>(null);
  const treeButton = useRef<HTMLButtonElement>(null), treeId = useId();
  const session = useOptionalTmsSession();
  const { library, visit, toggleStar } = useProductDocsLibrary(scope, session?.subject);
  const project = useProductDocList(api, scope, { parentId: null, refresh: treeRefresh });
  const canEdit = project.data?.canEdit ?? false;
  const canViewArchive = project.data?.canPublish ?? false;
  const resource = useProductDocSelection(api, scope, selection, explicitDraft, docRefresh, canEdit);
  const page = selection && resource.status === "ready" ? resource.data : undefined;
  const showComments = page?.kind === "page" && !page.archivedAt && page.version !== null && page.version === page.publishedVersion;
  const openingDraft = Boolean(openingPage.current && openingPage.current === selection?.docId);
  const editing = openingDraft || explicitDraft || (page?.kind === "page" && page.version === null);
  const pageEditor = editing && !editor.folder && page?.kind !== "folder";
  const creationParent = editing ? page?.parentId ?? null : selection?.docId ?? null;
  const openStructure = structureOpen && canEdit;
  const path = useProductDocAncestors(api, scope, page?.parentId, docRefresh, canEdit);
  useEffect(() => {
    if (page?.kind === "page" && !page.archivedAt && page.version !== null) visit(page.id);
  }, [page?.id, page?.kind, page?.archivedAt, page?.version, visit]);
  useEffect(() => {
    if (page?.id === openingPage.current) openingPage.current = undefined;
  }, [page?.id]);

  function choose(next: ProductDocSelection | undefined) {
    return requestAuthoringLeave(() => {
      setStructureOpen(false);
      setTreeOpen(false);
      return onSelect(next);
    });
  }
  function browse(next: ProductDocsShelf = "overview") {
    return requestAuthoringLeave(() => {
      clearSearch();
      setShelf(next);
      return choose(undefined);
    });
  }
  function onCreated(id: string, kind: ProductDocNode["kind"]) {
    clearSearch();
    setTreeRefresh((value) => value + 1);
    const next = { docId: id };
    if (kind === "folder") onSelect(next);
    else {
      openingPage.current = id;
      choose(next);
    }
  }
  function selectNode(node: ProductDocNode) {
    if (editing && node.id === selection?.docId) {
      setTreeOpen(false);
      setStructureOpen(false);
    } else {
      clearSearch();
      choose({ docId: node.id, sectionId: node.match?.sectionId ?? undefined });
    }
  }
  function openShelfNode(node: ProductDocNode, caseId?: string) {
    if (!caseId || !onOpenCase) return selectNode(node);
    clearSearch();
    setStructureOpen(false);
    setTreeOpen(false);
    onOpenCase({ projectId: scope.projectId, caseId }, { docId: node.id });
  }
  const refreshDocs = useCallback(() => {
    setDocRefresh((value) => value + 1);
    setTreeRefresh((value) => value + 1);
  }, []);
  const lifecycle = useProductDocLifecycle({ api, scope, copy, locale, drafts, selection, path,
    ownerId: session?.subject ?? undefined, onSelect: choose, onChanged: refreshDocs });
  function closeDraft(published = false) {
    setEditor({ key: routeKey, open: false, folder: false });
    refreshDocs();
    if (!published && page?.kind === "page" && page.publishedVersion === null) return onSelect(page.parentId ? { docId: page.parentId } : undefined);
  }
  const subdocs = page?.kind === "page" && selection?.version === undefined && !page.archivedAt
    ? <ProductDocSubdocs key={page.id} api={api} scope={scope} copy={copy} locale={locale}
      parentId={page.id} refresh={treeRefresh} draft={canEdit} onOpen={selectNode}
      createPage={page.canEdit ? <CreateProductDoc api={api} scope={scope} copy={copy}
        parentId={page.id} kind="page" inline projectName={projectName} pageLabel={locale === "ru" ? "Добавить подстраницу" : "Add subdoc"} onCreated={onCreated}
        onCreatePage={editing ? (create) => requestNewPage.current?.(create) : undefined} /> : undefined} />
    : undefined;
  return <section className={styles.workspace} aria-label={copy.title} data-tree-open={treeOpen || undefined} data-editing={pageEditor || undefined}>
    {!pageEditor && <ProductDocsLibraryBar copy={copy} treeButton={treeButton} treeId={treeId} treeOpen={treeOpen} scope={scope} {...search}
      onToggleTree={() => setTreeOpen((open) => !open)} onHome={() => browse()}
      onSearch={(query) => { setSearch((current) => ({ ...current, query })); setTreeOpen(true); }}
      onTaxonomy={(taxonomy) => { setSearch((current) => ({ ...current, taxonomy })); setTreeOpen(true); }}
      onSearchClose={() => { clearSearch(); setTreeOpen(false); }} />}
    <ProductDocsTree id={treeId} api={api} scope={scope} copy={copy} locale={locale} path={path}
      selectedId={selection?.docId} refresh={treeRefresh} draft={canEdit} canArchive={canViewArchive} lifecycle={lifecycle} shelf={shelf} {...search}
      treeControls={canEdit && <ProductDocsTreeControls api={api} scope={scope} copy={copy}
        parentId={structureOpen || page?.archivedAt ? null : creationParent}
        pageLabel={!editing && !structureOpen ? newPageLabel : undefined} structureOpen={structureOpen} structureButton={structureButton}
        onCreated={structureOpen || editing ? refreshDocs : onCreated} onStructure={() => { setStructureOpen(true); setTreeOpen(false); }} />}
      onHome={browse} onSelect={selectNode} onAppearanceSaved={refreshDocs} onEscape={() => {
        const toggle = treeButton.current;
        if (!treeOpen || !toggle?.getClientRects().length) return;
        setTreeOpen(false);
        toggle.focus({ preventScroll: true });
      }} />
    <AnimatePresence initial={false}>{openStructure && <ProductDocsStructure api={api} scope={scope} copy={copy} refresh={treeRefresh} lifecycle={lifecycle}
      initialPath={path} lockedId={editing ? selection?.docId : undefined}
      onBack={() => {
        setStructureOpen(false);
        const sidebarToggle = treeButton.current;
        (sidebarToggle?.getClientRects().length ? sidebarToggle : structureButton.current)?.focus({ preventScroll: true });
      }}
      onOpen={selectNode} onChanged={refreshDocs} />}</AnimatePresence>
    <div ref={articleRoot} className={styles.main} data-document-page={page?.kind === "page" || pageEditor || undefined} inert={openStructure} data-structure-behind={openStructure || undefined}>
      <ProductDocsWorkspaceHeader copy={copy} projectName={projectName} path={path} onHome={() => browse()} onSelect={selectNode}
        currentTitle={page?.title ?? (selection ? copy.loading : shelf === "recent" ? copy.recent : shelf === "starred"
          ? copy.starred : shelf === "archive" ? copy.archive : copy.libraryHome)}
        navigation={pageEditor ? { button: treeButton, id: treeId, open: treeOpen, toggle: () => setTreeOpen((open) => !open) } : undefined}
        actions={editing ? <div ref={editorActionsRef} className={styles.topActions} /> : page &&
          <ProductDocActions key={`${page.id}:${page.version}`} api={api} scope={scope} path={path} document={page} copy={copy} locale={locale} lifecycle={lifecycle}
            showDiscussion={showComments && selection?.version === undefined}
            onDiscussion={() => {
              const activity = articleRoot.current?.querySelector<HTMLElement>("[data-product-doc-activity]");
              activity?.focus({ preventScroll: true });
              activity?.scrollIntoView({ block: "start" });
            }}
            onEdit={() => { void requestAuthoringLeave(() => setEditor({ key: routeKey, open: true, folder: page.kind === "folder" })); }}
            starred={library.starred.includes(page.id)} onStar={() => toggleStar(page.id)}
            onVersion={(version) => choose({ docId: page.id, version })}
            onChanged={refreshDocs} />} />
      <div className={styles.scroll}>
        {!selection && <ProductDocsShelfContents api={api} scope={scope} copy={copy} locale={locale} projectName={projectName}
          shelf={shelf} project={project} recent={library.recent} starred={library.starred} canArchive={canViewArchive} refresh={treeRefresh} lifecycle={lifecycle}
          onChanged={refreshDocs} onOpen={openShelfNode} onBrowseRecent={() => browse("recent")} />}
        {selection && resource.status !== "ready" && <ReadState copy={copy}
          status={project.loading ? "loading" : resource.status} retry={resource.retry} />}
        {selection && page && <ProductDocsSelectedPage api={api} scope={scope} page={page} selection={selection} locale={locale}
          copy={copy} editing={editing} projectName={projectName} subdocs={subdocs} drafts={drafts} editorActionsRef={editorActionsRef} lifecycle={lifecycle}
          requestNewPageRef={requestNewPage} refresh={treeRefresh} canEdit={canEdit} starred={library.starred} onOpen={selectNode}
          onCloseDraft={closeDraft} onSaved={() => setTreeRefresh((value) => value + 1)}
          folderCreation={page.kind === "folder" && page.canEdit && !page.archivedAt ? <CreateProductDoc api={api} scope={scope} copy={copy}
            parentId={page.id} kind="page" inline projectName={projectName} pageLabel={newPageLabel} onCreated={onCreated} /> : undefined}
          onSelectSection={(sectionId) => choose({ ...selection, sectionId })} onOpenCase={onOpenCase}
          context={showComments && selection.sectionId ? <RelatedCases api={api} scope={scope} document={page} copy={copy} locale={locale}
            sectionId={selection.sectionId} onOpenCase={onOpenCase} onCreateCase={onCreateCase} /> : undefined} />}
      </div>
    </div>
  </section>;
}

"use client";

import { AnimatePresence } from "framer-motion";
import { PanelLeft, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import type { TmsLocale } from "../../localization/model/locale";
import type { ProductDocNode, ProductDocScope, ProductDocSelection, ProductDocsApi } from "../domain/product-docs";
import type { ProductDocDraftBuffer } from "../state/draft/draft-buffer";
import { useProductDocDraftRoute } from "../state/draft/useProductDocDraftRoute";
import { productDocsCopy } from "../localization/copy";
import { useProductDocAncestors } from "../state/tree/useProductDocAncestors";
import { useProductDocList } from "../state/tree/useProductDocList";
import { useProductDocSelection } from "../state/useProductDocSelection";
import { useProductDocsLibrary, type ProductDocsShelf } from "../state/library/useProductDocsLibrary";
import { ProductDocArticle } from "./article/ProductDocArticle";
import reader from "./article/reader.module.css";
import { ProductDocComments } from "./article/discussion/ProductDocComments";
import { ReadState } from "./status/ReadState";
import { RelatedCases } from "./article/RelatedCases";
import { ProductDocDraft } from "./draft/ProductDocDraft";
import { ProductDocsStructure } from "./structure/ProductDocsStructure";
import { CreateProductDoc } from "./toolbar/CreateProductDoc";
import { ProductDocActions } from "./toolbar/actions/ProductDocActions";
import { ProductDocsOverview } from "./tree/ProductDocsOverview";
import { ProductDocSectionContents } from "./tree/sections/ProductDocSectionContents";
import { ProductDocsTree } from "./tree/ProductDocsTree";
import { ProductDocsTreeControls } from "./tree/controls/ProductDocsTreeControls";
import { ProductDocsMark } from "./tree/empty/ProductDocsMark";
import styles from "./product-docs.module.css";
type Props = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  locale: TmsLocale;
  projectName?: string;
  drafts: ProductDocDraftBuffer;
  selection?: ProductDocSelection;
  onSelect(selection: ProductDocSelection | undefined): void;
  onOpenCase?: (location: { projectId: string; caseId: string }) => void;
};

export function ProductDocsView(props: Props) {
  return <ProjectDocumentation key={JSON.stringify([props.scope.workspaceId, props.scope.projectId])} {...props} />;
}
function ProjectDocumentation({ api, scope, locale, projectName, drafts, selection, onSelect, onOpenCase }: Props) {
  const copy = productDocsCopy(locale);
  const { routeKey, editor, explicitDraft, setEditor } = useProductDocDraftRoute(scope, selection, drafts);
  const [treeOpen, setTreeOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<ProductDocsShelf>("overview");
  const [treeRefresh, setTreeRefresh] = useState(0);
  const [docRefresh, setDocRefresh] = useState(0);
  const [discussionFor, setDiscussionFor] = useState<string>();
  const discussionButton = useRef<HTMLButtonElement>(null);
  const editorActionsRef = useRef<HTMLDivElement>(null);
  const structureButton = useRef<HTMLButtonElement>(null);
  const treeButton = useRef<HTMLButtonElement>(null);
  const treeId = useId();
  const session = useOptionalTmsSession();
  const { library, visit, toggleStar } = useProductDocsLibrary(scope, session?.subject);
  const project = useProductDocList(api, scope, { parentId: null, refresh: treeRefresh });
  const canEdit = project.data?.canEdit ?? false;
  const resource = useProductDocSelection(api, scope, selection, explicitDraft, docRefresh, canEdit);
  const page = selection && resource.status === "ready" ? resource.data : undefined;
  const showComments = page?.kind === "page" && page.version !== null && page.version === page.publishedVersion;
  const discussionOpen = showComments && discussionFor === page?.id;
  const editing = explicitDraft || (page?.kind === "page" && page.version === null);
  const path = useProductDocAncestors(api, scope, page?.parentId, docRefresh, canEdit);

  useEffect(() => {
    if (page?.kind === "page" && page.version !== null) visit(page.id);
  }, [page?.id, page?.kind, page?.version, visit]);

  function choose(next: ProductDocSelection | undefined) {
    setStructureOpen(false);
    onSelect(next);
    setTreeOpen(false);
  }

  function browse(next: ProductDocsShelf = "overview") {
    setQuery("");
    setShelf(next);
    choose(undefined);
  }

  function onCreated(id: string, kind: ProductDocNode["kind"]) {
    setQuery("");
    setTreeRefresh((value) => value + 1);
    if (kind === "folder") onSelect({ docId: id });
    else choose({ docId: id });
  }

  function selectNode(node: ProductDocNode) {
    if (editing && node.id === selection?.docId) {
      setTreeOpen(false);
      setStructureOpen(false);
    } else {
      setQuery("");
      choose({ docId: node.id });
    }
  }

  function refreshDocs() {
    setDocRefresh((value) => value + 1);
    setTreeRefresh((value) => value + 1);
  }

  function closeDraft(published = false) {
    setEditor({ key: routeKey, open: false, folder: false });
    if (!published && page?.kind === "page" && page.publishedVersion === null) onSelect(undefined);
    refreshDocs();
  }

  return <section className={styles.workspace} aria-label={copy.title} data-tree-open={treeOpen || undefined} data-editing={(editing && !editor.folder && page?.kind !== "folder") || undefined}>
    <header className={styles.libraryBar}>
      <div className={styles.libraryIdentity}>
        <button ref={treeButton} className={`${styles.mobileTree} ${styles.hoverLine}`} type="button" aria-label={copy.browse}
          aria-expanded={treeOpen} aria-controls={treeId}
          onClick={() => setTreeOpen((open) => !open)}><PanelLeft size={18} aria-hidden="true" /></button>
        <button type="button" className={`${styles.libraryTitle} ${styles.hoverLine}`} onClick={() => browse()}>
          <ProductDocsMark /> <span>{copy.title}</span>
        </button>
      </div>
      <label className={styles.librarySearch} data-input-shell>
        <Search size={16} aria-hidden="true" />
        <input type="search" aria-label={copy.search} placeholder={copy.search} value={query} maxLength={120}
          onChange={(event) => { setQuery(event.target.value); setTreeOpen(true); }}
          onKeyDown={(event) => { if (event.key === "Escape") { setQuery(""); setTreeOpen(false); } }} />
      </label>
      {canEdit && !structureOpen && <CreateProductDoc key={selection?.docId ?? "root"} api={api} scope={scope} copy={copy}
        parentId={selection?.docId ?? null} kind="page" onCreated={onCreated} />}
    </header>
    <ProductDocsTree id={treeId} api={api} scope={scope} copy={copy} locale={locale} path={path}
      selectedId={selection?.docId} refresh={treeRefresh} draft={canEdit} shelf={shelf} query={query}
      treeControls={canEdit && <ProductDocsTreeControls api={api} scope={scope} copy={copy}
        parentId={structureOpen ? null : selection?.docId ?? null} structureOpen={structureOpen} structureButton={structureButton}
        onCreated={structureOpen ? refreshDocs : onCreated} onStructure={() => { setStructureOpen(true); setTreeOpen(false); }} />}
      onHome={browse} onSelect={selectNode} onEscape={() => {
        const toggle = treeButton.current;
        if (!treeOpen || !toggle?.getClientRects().length) return;
        setTreeOpen(false);
        toggle.focus({ preventScroll: true });
      }} />
    <AnimatePresence initial={false}>{structureOpen && canEdit && <ProductDocsStructure api={api} scope={scope} copy={copy} refresh={treeRefresh}
      initialPath={path} lockedId={editing ? selection?.docId : undefined}
      onBack={() => {
        setStructureOpen(false);
        const sidebarToggle = treeButton.current;
        (sidebarToggle?.getClientRects().length ? sidebarToggle : structureButton.current)?.focus({ preventScroll: true });
      }}
      onOpen={selectNode} onChanged={refreshDocs} />}</AnimatePresence>
    <div className={styles.main} ref={(element) => { if (element) element.inert = structureOpen && canEdit; }}>
      <header className={styles.topbar}>
        <nav className={`${styles.breadcrumbs} ${reader.breadcrumbs}`} aria-label={copy.title}>
          <button type="button" onClick={() => browse()}>{projectName || copy.title}</button>
          {path?.map((ancestor) => <button type="button" key={ancestor.id} onClick={() => selectNode(ancestor)}>{ancestor.title}</button>)}
          {page && <span aria-current="page" title={page.title}>{page.title}</span>}
          {!selection && <span aria-current="page">{shelf === "recent" ? copy.recent : shelf === "starred" ? copy.starred : copy.libraryHome}</span>}
        </nav>
        {editing ? <div ref={editorActionsRef} className={styles.topActions} /> : page &&
          <ProductDocActions key={`${page.id}:${page.version}`} api={api} scope={scope} path={path} document={page} copy={copy} locale={locale}
            discussionButton={discussionButton} discussionOpen={Boolean(discussionOpen)} showDiscussion={showComments}
            onDiscussion={() => setDiscussionFor(discussionOpen ? undefined : page.id)}
            onEdit={() => setEditor({ key: routeKey, open: true, folder: page.kind === "folder" })}
            starred={library.starred.includes(page.id)} onStar={() => toggleStar(page.id)}
            onVersion={(version) => choose({ docId: page.id, version })}
            onMoved={refreshDocs} />}
      </header>
      <div className={styles.scroll}>
        {!selection && (!project.data || (project.error && !project.data.nodes.length)) && <ReadState copy={copy}
          status={project.loading ? "loading" : "error"} retry={project.retry} />}
        {!selection && project.data && (!project.error || project.data.nodes.length > 0) && <ProductDocsOverview api={api} scope={scope} copy={copy}
          locale={locale} projectName={projectName} shelf={shelf} rootNodes={project.data.nodes} recent={library.recent}
          starred={library.starred} onOpen={selectNode} onBrowseRecent={() => browse("recent")}
          onMoreRoot={project.data.nextCursor ? (project.error ? project.retry : project.more) : undefined} loadingMoreRoot={project.loading} />}
        {selection && resource.status !== "ready" && <ReadState copy={copy}
          status={project.loading ? "loading" : resource.status} retry={resource.retry} />}
        {selection && page && editing && <ProductDocDraft key={page.id} api={api} scope={scope} document={page}
          locale={locale} copy={copy} drafts={drafts} editorActionsRef={editorActionsRef} onClose={() => closeDraft()} onPublished={() => closeDraft(true)}
          onSaved={() => setTreeRefresh((value) => value + 1)} />}
        {selection && page?.kind === "folder" && !editing && <ProductDocSectionContents api={api} scope={scope}
          node={page} copy={copy} locale={locale} refresh={treeRefresh} draft={canEdit} starred={library.starred} onOpen={selectNode} />}
        {selection && page?.kind === "page" && !editing && <ProductDocArticle key={page.id + ":" + page.version} document={page} copy={copy}
          versionPinned={selection.version !== undefined} sectionId={selection.sectionId}
          onSelectSection={(sectionId) => choose({ ...selection, sectionId })}
          context={page.kind === "page" && page.version === page.publishedVersion
            ? <>
              {discussionOpen && <ProductDocComments api={api} scope={scope} docId={page.id} locale={locale}
                copy={copy} onClose={() => {
                  setDiscussionFor(undefined);
                  discussionButton.current?.focus({ preventScroll: true });
                }} />}
              <RelatedCases api={api} scope={scope} document={page} copy={copy} onOpenCase={onOpenCase} />
            </>
            : undefined} />}
      </div>
    </div>
  </section>;
}

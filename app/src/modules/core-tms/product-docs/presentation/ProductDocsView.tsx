"use client";

import { BookOpen, ChevronLeft, ChevronRight, Download, PanelLeft, Pencil } from "lucide-react";
import { useState } from "react";
import type { TmsLocale } from "../../localization/model/locale";
import type { ProductDocDetail, ProductDocNode, ProductDocScope, ProductDocSelection, ProductDocsApi } from "../domain/product-docs";
import { productDocDraftKey, type ProductDocDraftBuffer } from "../state/draft/draft-buffer";
import { productDocsCopy } from "../localization/copy";
import { useProductDocAncestors } from "../state/tree/useProductDocAncestors";
import { useProductDocList } from "../state/tree/useProductDocList";
import { useProductDocSelection } from "../state/useProductDocSelection";
import { ProductDocArticle } from "./article/ProductDocArticle";
import { ReadState } from "./status/ReadState";
import { RelatedCases } from "./article/RelatedCases";
import { ProductDocDraft } from "./draft/ProductDocDraft";
import { CreateProductDoc } from "./toolbar/CreateProductDoc";
import { MoveProductDoc } from "./toolbar/MoveProductDoc";
import { ProductDocsTree } from "./tree/ProductDocsTree";
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
  const routeKey = JSON.stringify([selection?.docId, selection?.version]);
  const resumeDraft = selection?.version === undefined && !!selection?.docId
    && drafts.has(productDocDraftKey(scope, selection.docId));
  const [editor, setEditor] = useState({ key: routeKey, open: resumeDraft });
  if (editor.key !== routeKey) setEditor({ key: routeKey, open: resumeDraft });
  const [treeOpen, setTreeOpen] = useState(false);
  const [treeRefresh, setTreeRefresh] = useState(0);
  const [docRefresh, setDocRefresh] = useState(0);
  const project = useProductDocList(api, scope, { parentId: null, refresh: 0 });
  const canEdit = project.data?.canEdit ?? false;
  const explicitDraft = editor.key === routeKey ? editor.open : resumeDraft;
  const resource = useProductDocSelection(api, scope, selection, explicitDraft, docRefresh, canEdit);
  const page = selection && resource.status === "ready" ? resource.data : undefined;
  const editing = explicitDraft || (page?.kind === "page" && page.version === null);
  const path = useProductDocAncestors(api, scope, page?.parentId, docRefresh, canEdit);

  function choose(next: ProductDocSelection | undefined) {
    onSelect(next);
    setTreeOpen(false);
  }

  function selectNode(node: ProductDocNode) {
    if (editing && node.id === selection?.docId) setTreeOpen(false);
    else choose({ docId: node.id });
  }

  function closeDraft(published = false) {
    setEditor({ key: routeKey, open: false });
    if (!published && page?.kind === "page" && page.publishedVersion === null) onSelect(undefined);
    setDocRefresh((value) => value + 1);
    setTreeRefresh((value) => value + 1);
  }

  return <section className={styles.workspace} aria-label={copy.title} data-tree-open={treeOpen || undefined}>
    <ProductDocsTree api={api} scope={scope} copy={copy} projectName={projectName} path={path}
      selectedId={selection?.docId} refresh={treeRefresh} draft={canEdit}
      onHome={() => choose(undefined)} onSelect={selectNode} />
    <div className={styles.main}>
      <header className={styles.topbar}>
        <button className={styles.mobileTree} type="button" aria-label={copy.browse} aria-expanded={treeOpen}
          onClick={() => setTreeOpen((open) => !open)}><PanelLeft size={18} aria-hidden="true" /></button>
        <nav className={styles.breadcrumbs} aria-label={copy.title}>
          <button type="button" onClick={() => choose(undefined)}>{copy.title}</button>
          {path?.map((ancestor) => <button type="button" key={ancestor.id} onClick={() => selectNode(ancestor)}>{ancestor.title}</button>)}
          {page && <span aria-current="page" title={page.title}>{page.title}</span>}
        </nav>
        {!editing && <div className={styles.topActions}>
          {page?.version && <div className={styles.versionActions}>
            <button type="button" className={styles.iconButton} aria-label={copy.previousVersion} title={copy.previousVersion}
              disabled={page.version === 1} onClick={() => choose({ docId: page.id, version: page.version! - 1 })}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span>{copy.version} {page.version}</span>
            <button type="button" className={styles.iconButton} aria-label={copy.nextVersion} title={copy.nextVersion}
              disabled={page.version === page.publishedVersion}
              onClick={() => choose({ docId: page.id, version: page.version! + 1 })}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>}
          {page?.version && <button type="button" className={styles.iconButton} aria-label={copy.exportMarkdown}
            title={copy.exportMarkdown} onClick={() => downloadMarkdown(page)}>
            <Download size={16} aria-hidden="true" />
          </button>}
          {page?.canEdit && page.version === page.publishedVersion && <MoveProductDoc key={page.id} api={api}
            scope={scope} document={page} copy={copy} onMoved={() => {
              setDocRefresh((value) => value + 1);
              setTreeRefresh((value) => value + 1);
            }} />}
          {page?.canEdit && page.version === page.publishedVersion
            && <button type="button" className={styles.action} onClick={() => setEditor({ key: routeKey, open: true })}>
              <Pencil size={15} aria-hidden="true" /> {page.kind === "folder" ? copy.renameFolder : copy.edit}
            </button>}
          {canEdit && <CreateProductDoc key={page?.id ?? "root"} api={api} scope={scope} copy={copy}
            parentId={page?.id ?? null} onCreated={(id) => {
              setTreeRefresh((value) => value + 1);
              choose({ docId: id });
            }} />}
        </div>}
      </header>
      <div className={styles.scroll}>
        {!selection && (project.loading || project.error) && <ReadState copy={copy}
          status={project.loading ? "loading" : "error"} retry={project.retry} />}
        {!selection && !project.loading && !project.error && <div className={styles.landing}>
          <BookOpen size={26} aria-hidden="true" />
          <h1>{projectName || copy.title}</h1>
          <p>{copy.intro}</p>
          <p>{project.data?.nodes.length || canEdit ? copy.choose : copy.noPages}</p>
        </div>}
        {selection && resource.status !== "ready" && <ReadState copy={copy}
          status={project.loading ? "loading" : resource.status} retry={resource.retry} />}
        {selection && page && editing && <ProductDocDraft key={page.id} api={api} scope={scope} document={page}
          locale={locale} copy={copy} drafts={drafts} onClose={() => closeDraft()} onPublished={() => closeDraft(true)}
          onSaved={() => setTreeRefresh((value) => value + 1)} />}
        {selection && page && !editing && <ProductDocArticle key={page.id + ":" + page.version} document={page} copy={copy}
          sectionId={selection.sectionId} onSelectSection={(sectionId) => choose({ ...selection, sectionId })}
          context={page.kind === "page" && page.version === page.publishedVersion
            ? <RelatedCases api={api} scope={scope} document={page} copy={copy} onOpenCase={onOpenCase} />
            : undefined} />}
      </div>
    </div>
  </section>;
}

function downloadMarkdown(page: ProductDocDetail) {
  const contents = ["# " + page.title, ...page.sections.map((section) =>
    [section.title ? "## " + section.title : "", section.markdown].filter(Boolean).join("\n\n"))].join("\n\n");
  const url = URL.createObjectURL(new Blob([contents], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.download = (page.title.replace(/[\\/:*?"<>|]/g, "-").trim() || "article") + ".md";
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

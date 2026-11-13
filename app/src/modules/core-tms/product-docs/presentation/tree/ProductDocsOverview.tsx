"use client";
import { ArrowUpRight, Star } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import { isMissingProductDoc } from "../../domain/errors/product-doc-response";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocFolderEntry } from "../../state/library/folder-entry/useProductDocFolderEntry";
import type { ProductDocsShelf } from "../../state/library/useProductDocsLibrary";
import { ReadState } from "../status/ReadState";
import { ProductDocSectionIcon } from "./appearance/ProductDocSectionIcon";
import { ProductDocsEmpty } from "./empty/ProductDocsEmpty";
import styles from "./shelves/shelves.module.css";

const shelfCopy = {
  en: {
    overview: "Project rules, workflows and testing guides in one place.",
    recent: "Pages in the order you last opened them.",
    starred: "Pages you marked for easy access.",
    sections: "Sections",
    pages: "Pages",
    resume: "Continue reading",
    allRecent: "All recent pages",
  },
  ru: {
    overview: "Правила проекта, рабочие процессы и инструкции по тестированию.",
    recent: "Страницы в порядке последнего открытия.",
    starred: "Страницы, которые вы добавили в избранное.",
    sections: "Разделы",
    pages: "Страницы",
    resume: "Продолжить чтение",
    allRecent: "Все недавние",
  },
};

type ShelfResult = { key: string; nodes: ProductDocNode[]; error: boolean };

function useShelfNodes(api: ProductDocsApi, scope: ProductDocScope, ids: readonly string[]) {
  const { workspaceId, projectId } = scope;
  const selection = ids.length ? JSON.stringify(ids) : "";
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([workspaceId, projectId, selection, attempt]);
  const [resolved, setResolved] = useState<ShelfResult>();

  useEffect(() => {
    if (!selection) return;
    const controller = new AbortController();
    const selectedIds = JSON.parse(selection) as string[];
    const requests = selectedIds.map((id) => api.get({ workspaceId, projectId }, id, { signal: controller.signal }));
    void Promise.allSettled(requests).then((results) => {
      if (controller.signal.aborted) return;
      setResolved({
        key,
        nodes: results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []),
        error: results.some((result) => result.status === "rejected" && !isMissingProductDoc(result.reason)),
      });
    });
    return () => controller.abort();
  }, [api, workspaceId, projectId, key, selection]);

  const loaded = resolved?.key === key ? resolved : undefined;
  return {
    nodes: loaded?.nodes ?? [],
    loading: Boolean(selection && !loaded),
    error: loaded?.error ?? false,
    retry() { setAttempt((value) => value + 1); },
  };
}

export function ProductDocsOverview({
  api, scope, copy, locale, shelf, projectName, rootNodes = [], recent, starred, onOpen, onBrowseRecent,
  onMoreRoot, loadingMoreRoot, canEdit,
}: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  shelf: Exclude<ProductDocsShelf, "archive">;
  projectName?: string;
  rootNodes?: readonly ProductDocNode[];
  recent: readonly string[];
  starred: readonly string[];
  onOpen(node: ProductDocNode, caseId?: string): void;
  onBrowseRecent?(): void;
  onMoreRoot?(): void;
  loadingMoreRoot?: boolean;
  canEdit: boolean;
}) {
  const titleId = useId();
  const resumeId = useId();
  const labels = shelfCopy[locale];
  const overview = shelf === "overview";
  const { openNode, openingFolder } = useProductDocFolderEntry(api, scope, shelf, canEdit, onOpen);
  const ids = overview ? recent.slice(0, 4) : shelf === "recent" ? recent : starred;
  const saved = useShelfNodes(api, scope, ids);
  const names = new Map([...rootNodes, ...saved.nodes].map((node) => [node.id, node.title]));
  const starredIds = new Set(starred);
  const hasContent = overview ? rootNodes.length > 0 || saved.nodes.length > 0 : saved.nodes.length > 0;
  const title = overview ? copy.libraryHome : shelf === "recent" ? copy.recent : copy.starred;
  const feedback = saved.error ? "error" : saved.loading ? "loading" : undefined;
  const rowProps = { scope, copy, names, projectName, starredIds, onOpen: openNode };
  const recentSection = overview && saved.nodes.length > 0 ? <section className={styles.group} aria-labelledby={resumeId}>
    <header className={styles.groupHeader}>
      <h2 id={resumeId}>{labels.resume}</h2>
      {onBrowseRecent && <button className={styles.viewAll} type="button" onClick={onBrowseRecent}>{labels.allRecent}</button>}
    </header>
    <PageRows {...rowProps} nodes={saved.nodes} showLocation />
  </section> : undefined;

  return <section className={styles.shelf} data-empty={!hasContent && !feedback || undefined} aria-labelledby={titleId}>
    <div className={styles.body}>
      <header className={styles.intro}>
        <h1 id={titleId}>{title}</h1>
        <p>{labels[shelf]}</p>
      </header>
      {!hasContent && !feedback && <ProductDocsEmpty key={shelf} copy={copy} shelf={shelf} />}
      {!overview && saved.nodes.length > 0 && <PageRows {...rowProps} nodes={saved.nodes} showLocation />}
      {overview && hasContent && <ProductDocsDirectory scope={scope} copy={copy} locale={locale} nodes={rootNodes}
        starred={starred} onOpen={openNode} openingFolder={openingFolder} alongside={recentSection} />}
      {overview && onMoreRoot && <button className={styles.more} type="button" disabled={loadingMoreRoot} onClick={onMoreRoot}>
        {loadingMoreRoot ? copy.loading : copy.more}
      </button>}
      {feedback && (!overview || !hasContent) && <ReadState copy={copy} status={feedback} retry={saved.retry} />}
    </div>
  </section>;
}

export function ProductDocsDirectory({ scope, copy, locale, nodes, starred = [], onOpen, openingFolder, alongside, showPagesHeading = true }: {
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  nodes: readonly ProductDocNode[];
  starred?: readonly string[];
  onOpen(node: ProductDocNode): void;
  openingFolder?: string;
  alongside?: ReactNode;
  showPagesHeading?: boolean;
}) {
  const sectionsId = useId(), pagesId = useId();
  const labels = shelfCopy[locale];
  const sections = nodes.filter((node) => node.kind === "folder");
  const pages = nodes.filter((node) => node.kind === "page");
  const PagesGroup = showPagesHeading ? "section" : "div";
  if (!nodes.length && !alongside) return null;
  return <div className={styles.directory}>
    {sections.length > 0 && <section className={styles.group} aria-labelledby={sectionsId}>
      <h2 id={sectionsId}>{labels.sections}</h2>
      <ul className={styles.sectionTiles}>
        {sections.map((node) => <li key={node.id}>
          <button className={styles.sectionTile} type="button"
            aria-busy={openingFolder === node.id || undefined} onClick={() => onOpen(node)}>
            <span className={styles.tileTop}>
              <ProductDocSectionIcon scope={scope} node={node} size={28} />
              <ArrowUpRight className={styles.tileArrow} size={15} aria-hidden="true" />
            </span>
            <span className={styles.sectionTitle}>{node.title}</span>
          </button>
        </li>)}
      </ul>
    </section>}
    {(pages.length > 0 || alongside) && <div className={styles.overviewPages}
      data-split={pages.length > 0 && Boolean(alongside) || undefined}>
      {pages.length > 0 && <PagesGroup className={styles.group} aria-labelledby={showPagesHeading ? pagesId : undefined}>
        {showPagesHeading && <h2 id={pagesId}>{labels.pages}</h2>}
        <PageRows scope={scope} copy={copy} nodes={pages} starredIds={new Set(starred)} onOpen={onOpen} />
      </PagesGroup>}
      {alongside}
    </div>}</div>;
}

function PageRows({ scope, copy, nodes, names, projectName, starredIds, showLocation, onOpen }: {
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  nodes: readonly ProductDocNode[];
  names?: ReadonlyMap<string, string>;
  projectName?: string;
  starredIds: ReadonlySet<string>;
  showLocation?: boolean;
  onOpen(node: ProductDocNode): void;
}) {
  return <ul className={styles.pageRows}>
    {nodes.map((node) => {
      const location = showLocation ? node.parentId ? names?.get(node.parentId) : projectName : undefined;
      const draft = node.kind === "page" && node.publishedVersion === null;
      return <li key={node.id}>
        <button className={styles.pageRow} type="button" onClick={() => onOpen(node)}>
          <span className={styles.pageName}>
            {node.kind === "folder" && <ProductDocSectionIcon scope={scope} node={node} size={17} />}
            <span className={styles.pageTitle}>{node.title}</span>
            {starredIds.has(node.id) && <Star className={styles.star} size={13} aria-label={copy.starred} />}
          </span>
          {(draft || location) && <span className={styles.metadata}>
            {location && <span>{location}</span>}
            {draft && <small className={styles.draft}>{copy.draft}</small>}
          </span>}
        </button>
      </li>;
    })}
  </ul>;
}

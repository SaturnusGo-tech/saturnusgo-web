"use client";

import { Archive, ChevronRight, Clock3, LayoutGrid, Star } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { ProductDocTaxonomy } from "../../domain/product-doc-taxonomy";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import type { TmsLocale } from "../../../localization/model/locale";
import { useProductDocList } from "../../state/tree/useProductDocList";
import type { ProductDocsShelf } from "../../state/library/useProductDocsLibrary";
import { ProductDocsDisclosure } from "../motion/ProductDocsDisclosure";
import { ReadState } from "../status/ReadState";
import styles from "../product-docs.module.css";
import { ProductDocSectionAppearance } from "./appearance/ProductDocSectionAppearance";
import { ProductDocSectionIcon } from "./appearance/ProductDocSectionIcon";
import { ProductDocSearchResults } from "./search/ProductDocSearchResults";
import treeStyles from "./product-docs-tree.module.css";

type TreeProps = {
  id: string;
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  selectedId?: string;
  path?: readonly ProductDocNode[];
  refresh: number;
  draft: boolean;
  canArchive: boolean;
  query: string;
  taxonomy: ProductDocTaxonomy;
  shelf: ProductDocsShelf;
  treeControls?: ReactNode;
  onHome(shelf?: ProductDocsShelf): void;
  onSelect(node: ProductDocNode): void;
  onAppearanceSaved(): void;
  onEscape(): void;
};

export function ProductDocsTree(props: TreeProps) {
  const searching = Boolean(props.query.trim() || props.taxonomy.productGroup || props.taxonomy.product);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const path = props.path;
    if (path?.length) setOpen((current) => {
      const missing = path.filter((node) => !current.has(node.id));
      return missing.length ? new Set([...current, ...missing.map((node) => node.id)]) : current;
    });
  }, [props.path]);

  function toggle(id: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function choose(node: ProductDocNode) {
    if (node.kind === "folder") setOpen((current) => new Set([...current, node.id]));
    props.onSelect(node);
  }

  return <aside id={props.id} className={`${styles.tree} ${treeStyles.sidebar}`} aria-label={props.copy.tree} onKeyDown={(event) => {
    if (event.key === "Escape" && !event.defaultPrevented) props.onEscape();
  }}>
    <nav className={treeStyles.views} aria-label={props.copy.browse}>
      {([
        ["overview", props.copy.libraryHome, LayoutGrid],
        ["recent", props.copy.recent, Clock3],
        ["starred", props.copy.starred, Star],
        ["archive", props.copy.archive, Archive],
      ] as const).filter(([shelf]) => shelf !== "archive" || props.canArchive)
        .map(([shelf, title, Icon]) => <button key={shelf} type="button" className={treeStyles.view}
        aria-current={!props.selectedId && props.shelf === shelf ? "page" : undefined} onClick={() => props.onHome(shelf)}>
        <Icon className={shelf === "starred" ? treeStyles.star : undefined} size={15} aria-hidden="true" /> {title}
      </button>)}
    </nav>
    <div className={styles.treeContent}>
      <div className={styles.treeHeading}>
        <h2>{searching ? props.copy.searchResults : props.copy.content}</h2>
        {!searching && props.treeControls}
      </div>
      <nav aria-label={searching ? props.copy.searchResults : props.copy.tree} className={`${styles.treeNav} ${treeStyles.navigation}`}>
        {searching
          ? <ProductDocSearchResults {...props} onChoose={choose} />
          : <Branch {...props} parentId={null} depth={0} open={open} onToggle={toggle} onChoose={choose} />}
      </nav>
    </div>
  </aside>;
}

function Branch(props: TreeProps & {
  parentId: string | null;
  depth: number;
  open: ReadonlySet<string>;
  onToggle(id: string): void;
  onChoose(node: ProductDocNode): void;
}) {
  const { data, loading, error, retry, more } = useProductDocList(props.api, props.scope, {
    parentId: props.parentId,
    refresh: props.refresh,
    draft: props.draft,
  });

  if (!data && loading) return <ReadState copy={props.copy} status="loading" retry={retry} />;
  if (error && !data?.nodes.length) return <ReadState copy={props.copy} status="error" retry={retry} />;

  return <>
    {data?.nodes.length ? <ul className={treeStyles.branch}>
      {data.nodes.map((node) => {
        const expanded = props.open.has(node.id);
        const selected = props.selectedId === node.id;
        const section = node.kind === "folder";
        const knownParent = props.path?.some((ancestor) => ancestor.id === node.id);
        return <li key={node.id}>
          <div className={treeStyles.row} data-current={selected || undefined}>
            {section && <div className={treeStyles.sectionMark}>
              {props.draft && data.canEdit
                ? <ProductDocSectionAppearance api={props.api} scope={props.scope} node={node} locale={props.locale}
                  onChanged={props.onAppearanceSaved} />
                : <ProductDocSectionIcon scope={props.scope} node={node} size={17} />}
            </div>}
            <button type="button" className={treeStyles.node} aria-current={selected ? "page" : undefined}
              onClick={() => props.onChoose(node)}>
              <span className={treeStyles.label}>{node.title}</span>
              {!section && node.publishedVersion === null && <small>{props.copy.draft}</small>}
            </button>
            <button type="button" className={treeStyles.disclosure}
              data-quiet={(!section && !knownParent && !expanded) || undefined}
              aria-label={`${expanded ? props.copy.collapseBranch : props.copy.expandBranch} ${node.title}`}
              aria-expanded={expanded} onClick={() => props.onToggle(node.id)}>
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
          <ProductDocsDisclosure open={expanded}>
            <div className={treeStyles.nested} data-flat={props.depth >= 4 || undefined}>
              <Branch {...props} parentId={node.id} depth={props.depth + 1} />
            </div>
          </ProductDocsDisclosure>
        </li>;
      })}
    </ul> : <p className={styles.treeEmpty}>{props.copy.noPages}</p>}
    {error
      ? <button type="button" className={styles.action} onClick={retry}>{props.copy.retry}</button>
      : data?.nextCursor && <button type="button" className={styles.action} disabled={loading} onClick={more}>{props.copy.more}</button>}
  </>;
}

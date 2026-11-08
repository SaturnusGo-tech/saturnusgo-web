"use client";

import { ChevronRight, Clock3, LayoutGrid, Star } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import type { TmsLocale } from "../../../localization/model/locale";
import { useProductDocList } from "../../state/tree/useProductDocList";
import type { ProductDocsShelf } from "../../state/library/useProductDocsLibrary";
import { ProductDocsDisclosure } from "../motion/ProductDocsDisclosure";
import { ReadState } from "../status/ReadState";
import styles from "../product-docs.module.css";
import { ProductDocSectionAppearance } from "./appearance/control/ProductDocSectionAppearance";
import { ProductDocSectionIcon } from "./appearance/ProductDocSectionIcon";
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
  query: string;
  shelf: ProductDocsShelf;
  treeControls?: ReactNode;
  onHome(shelf?: ProductDocsShelf): void;
  onSelect(node: ProductDocNode): void;
  onEscape(): void;
};

export function ProductDocsTree(props: TreeProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(props.query.trim()), 180);
    return () => window.clearTimeout(timer);
  }, [props.query]);

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
      ] as const).map(([shelf, title, Icon]) => <button key={shelf} type="button" className={treeStyles.view}
        aria-current={!props.selectedId && props.shelf === shelf ? "page" : undefined} onClick={() => props.onHome(shelf)}>
        <Icon className={shelf === "starred" ? treeStyles.star : undefined} size={15} aria-hidden="true" /> {title}
      </button>)}
    </nav>
    <div className={styles.treeContent}>
      <div className={styles.treeHeading}>
        <h2>{search ? props.copy.searchResults : props.copy.content}</h2>
        {!search && props.treeControls}
      </div>
      <nav aria-label={search ? props.copy.searchResults : props.copy.tree} className={`${styles.treeNav} ${treeStyles.navigation}`}>
        <Branch {...props} parentId={null} query={search} open={open} onToggle={toggle} onChoose={choose} />
      </nav>
    </div>
  </aside>;
}

function Branch(props: TreeProps & {
  parentId: string | null;
  query?: string;
  open: ReadonlySet<string>;
  onToggle(id: string): void;
  onChoose(node: ProductDocNode): void;
}) {
  const { data, loading, error, retry, more } = useProductDocList(props.api, props.scope, {
    parentId: props.query ? undefined : props.parentId,
    q: props.query || undefined,
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
                ? <ProductDocSectionAppearance scope={props.scope} node={node} locale={props.locale} />
                : <ProductDocSectionIcon scope={props.scope} node={node} size={17} />}
            </div>}
            <button type="button" className={treeStyles.node} aria-current={selected ? "page" : undefined}
              onClick={() => props.onChoose(node)} title={node.title}>
              <span className={treeStyles.label}>{node.title}</span>
              {!section && node.publishedVersion === null && <small>{props.copy.draft}</small>}
            </button>
            {!props.query && <button type="button" className={treeStyles.disclosure}
              data-quiet={(!section && !knownParent && !expanded) || undefined}
              aria-label={`${expanded ? props.copy.collapseBranch : props.copy.expandBranch} ${node.title}`}
              aria-expanded={expanded} onClick={() => props.onToggle(node.id)}>
              <ChevronRight size={13} aria-hidden="true" />
            </button>}
          </div>
          <ProductDocsDisclosure open={expanded && !props.query}>
            <div className={treeStyles.nested}><Branch {...props} parentId={node.id} /></div>
          </ProductDocsDisclosure>
        </li>;
      })}
    </ul> : <p className={styles.treeEmpty}>{props.query ? props.copy.noResults : props.copy.noPages}</p>}
    {error
      ? <button type="button" className={styles.action} onClick={retry}>{props.copy.retry}</button>
      : data?.nextCursor && <button type="button" className={styles.action} disabled={loading} onClick={more}>{props.copy.more}</button>}
  </>;
}

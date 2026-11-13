"use client";

import { Archive, Clock3, LayoutGrid, Star } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { ProductDocTaxonomy } from "../../domain/product-doc-taxonomy";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocsShelf } from "../../state/library/useProductDocsLibrary";
import styles from "../product-docs.module.css";
import { ProductDocSearchResults } from "./search/ProductDocSearchResults";
import treeStyles from "./product-docs-tree.module.css";
import { ProductDocsTreeBranch } from "./branch/ProductDocsTreeBranch";
import type { ProductDocLifecycleContext } from "../../state/lifecycle/product-doc-lifecycle-context";

export type TreeProps = {
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
  lifecycle: ProductDocLifecycleContext;
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
          : <ProductDocsTreeBranch {...props} parentId={null} depth={0} open={open} onToggle={toggle} onChoose={choose} />}
      </nav>
    </div>
  </aside>;
}

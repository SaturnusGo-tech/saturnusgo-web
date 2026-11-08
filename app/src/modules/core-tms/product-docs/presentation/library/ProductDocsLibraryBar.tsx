"use client";

import { PanelLeft, Search } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import type { ProductDocsCopy } from "../../localization/copy";
import { ProductDocsMark } from "../tree/empty/ProductDocsMark";
import styles from "../product-docs.module.css";

export function ProductDocsLibraryBar({
  copy, treeButton, treeId, treeOpen, query, onToggleTree, onHome, onSearch, onSearchClose, children,
}: {
  copy: ProductDocsCopy;
  treeButton: RefObject<HTMLButtonElement | null>;
  treeId: string;
  treeOpen: boolean;
  query: string;
  onToggleTree(): void;
  onHome(): void;
  onSearch(query: string): void;
  onSearchClose(): void;
  children?: ReactNode;
}) {
  return <header className={styles.libraryBar}>
    <div className={styles.libraryIdentity}>
      <button ref={treeButton} className={`${styles.mobileTree} ${styles.hoverLine}`} type="button" aria-label={copy.browse}
        aria-expanded={treeOpen} aria-controls={treeId} onClick={onToggleTree}><PanelLeft size={18} aria-hidden="true" /></button>
      <button type="button" className={`${styles.libraryTitle} ${styles.hoverLine}`} onClick={onHome}>
        <ProductDocsMark /> <span>{copy.title}</span>
      </button>
    </div>
    <label className={styles.librarySearch} data-input-shell>
      <Search size={16} aria-hidden="true" />
      <input type="search" aria-label={copy.search} placeholder={copy.search} value={query} maxLength={120}
        onChange={(event) => onSearch(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Escape") onSearchClose(); }} />
    </label>
    {children}
  </header>;
}

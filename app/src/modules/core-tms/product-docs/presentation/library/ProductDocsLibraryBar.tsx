"use client";

import { Input } from "@heroui/react";
import { PanelLeft, Search } from "lucide-react";
import type { RefObject } from "react";
import type { ProductDocTaxonomy } from "../../domain/product-doc-taxonomy";
import type { ProductDocScope } from "../../domain/product-docs";
import { ProductDocTaxonomyFields } from "../taxonomy/control/ProductDocTaxonomyFields";
import type { ProductDocsCopy } from "../../localization/copy";
import { ProductDocsMark } from "../tree/empty/ProductDocsMark";
import styles from "../product-docs.module.css";
import searchStyles from "./library-search.module.css";

export function ProductDocsLibraryBar({
  copy, scope, treeButton, treeId, treeOpen, query, taxonomy, onTaxonomy, onToggleTree, onHome, onSearch, onSearchClose,
}: {
  copy: ProductDocsCopy;
  scope: ProductDocScope;
  taxonomy: ProductDocTaxonomy;
  onTaxonomy(value: ProductDocTaxonomy): void;
  treeButton: RefObject<HTMLButtonElement | null>;
  treeId: string;
  treeOpen: boolean;
  query: string;
  onToggleTree(): void;
  onHome(): void;
  onSearch(query: string): void;
  onSearchClose(): void;
}) {
  return <header className={styles.libraryBar}>
    <div className={styles.libraryIdentity}>
      <button ref={treeButton} className={`${styles.mobileTree} ${styles.hoverLine}`} type="button" aria-label={copy.browse}
        aria-expanded={treeOpen} aria-controls={treeId} onClick={onToggleTree}><PanelLeft size={18} aria-hidden="true" /></button>
      <button type="button" className={`${styles.libraryTitle} ${styles.hoverLine}`} onClick={onHome}>
        <ProductDocsMark /> <span>{copy.title}</span>
      </button>
    </div>
    <div className={`${styles.librarySearch} ${searchStyles.search}`} role="search" aria-label={copy.search} data-input-shell>
      <Input type="search" size="sm" aria-label={copy.search} placeholder={copy.search} value={query} maxLength={120}
        classNames={{ base: searchStyles.input, inputWrapper: searchStyles.inputWrapper, innerWrapper: searchStyles.inputInner }}
        startContent={<Search size={16} aria-hidden="true" />} onValueChange={onSearch}
        onKeyDown={(event) => { if (event.key === "Escape") onSearchClose(); }} />
      <ProductDocTaxonomyFields scope={scope} value={taxonomy} onChange={onTaxonomy} filter />
    </div>
  </header>;
}

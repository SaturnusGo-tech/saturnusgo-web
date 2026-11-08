"use client";

import { ProductDocTooltip } from "../../overlay/ProductDocTooltip";

import { ListTree } from "lucide-react";
import type { RefObject } from "react";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import type { ProductDocsCopy } from "../../../localization/copy";
import { CreateProductDoc } from "../../toolbar/CreateProductDoc";
import styles from "../../product-docs.module.css";

export function ProductDocsTreeControls({ api, scope, copy, parentId, pageLabel, structureOpen, structureButton, onStructure, onCreated }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  parentId: string | null;
  pageLabel?: string;
  structureOpen: boolean;
  structureButton: RefObject<HTMLButtonElement | null>;
  onStructure(): void;
  onCreated(id: string, kind: ProductDocNode["kind"]): void;
}) {
  return <>
    {pageLabel && <div className={styles.treeCreatePage}>
      <ProductDocTooltip label={pageLabel}><CreateProductDoc api={api} scope={scope} copy={copy}
        parentId={null} kind="page" iconOnly pageLabel={pageLabel} onCreated={onCreated} /></ProductDocTooltip>
    </div>}
    <CreateProductDoc key={parentId ?? "root"} api={api} scope={scope} copy={copy}
      parentId={parentId} kind="folder" onCreated={onCreated} />
    <ProductDocTooltip label={copy.structure}><button ref={structureButton} type="button" className={`${styles.iconButton} ${styles.hoverLine}`}
      aria-label={copy.structure} aria-current={structureOpen ? "page" : undefined} onClick={onStructure}>
      <ListTree size={16} aria-hidden="true" />
    </button></ProductDocTooltip>
  </>;
}

"use client";

import { ProductDocModal } from "../../../../overlay/ProductDocModal";
import { ProductDocStructuredPreview } from "../ProductDocStructuredPreview";
import type { useProductDocStructuredRender } from "../render/useProductDocStructuredRender";
import styles from "../product-doc-structured.module.css";

export function ProductDocStructuredDialog({ kind, source, title, closeLabel, isOpen, onClose, result, showSource }: {
  kind: "diagram" | "math"; source: string; title: string; closeLabel: string; isOpen: boolean; onClose(): void;
  result: ReturnType<typeof useProductDocStructuredRender>; showSource?: boolean;
}) {
  const large = kind === "diagram" && !showSource;
  return <ProductDocModal isOpen={isOpen} onClose={onClose} title={title} closeLabel={closeLabel}
    className={large ? styles.expanded : undefined} bodyClassName={large ? styles.expandedContent : undefined}>
    <div className={styles.expandedBody}>
      {showSource ? <pre>{source}</pre> :
        <ProductDocStructuredPreview kind={kind} source={source} result={result} expanded />}
    </div>
  </ProductDocModal>;
}

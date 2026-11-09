"use client";

import { ProductDocModal } from "../../../../overlay/ProductDocModal";
import { ProductDocStructuredPreview } from "../ProductDocStructuredPreview";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { StructuredBlockActions } from "../controls/StructuredBlockActions";
import { useStructuredBlockActivity } from "../motion/useStructuredBlockActivity";
import type { useProductDocStructuredRender } from "../render/useProductDocStructuredRender";
import styles from "../product-doc-structured.module.css";

export function ProductDocStructuredDialog({ kind, source, title, closeLabel, isOpen, onClose, result, showSource }: {
  kind: "diagram" | "math"; source: string; title: string; closeLabel: string; isOpen: boolean; onClose(): void;
  result: ReturnType<typeof useProductDocStructuredRender>; showSource?: boolean;
}) {
  const { locale } = useTmsLocale();
  const preview = isOpen && !showSource && Boolean(source.trim());
  const activity = useStructuredBlockActivity(preview && !result, preview);
  const diagram = kind === "diagram" && !showSource;
  const className = diagram ? styles.expanded : kind === "math" && !showSource ? styles.expandedFormula : undefined;
  return <ProductDocModal isOpen={isOpen} onClose={onClose} title={title} closeLabel={closeLabel}
    className={className} bodyClassName={diagram ? styles.expandedContent : undefined}>
    <div className={styles.expandedBody}>
      {showSource ? <pre>{source}</pre> :
        <div className={styles.expandedPreview}>
          {activity.phase && <StructuredBlockActions phase={activity.phase}
            label={locale === "ru" ? "Готовим предпросмотр" : "Preparing preview"} />}
          {activity.reveal && <ProductDocStructuredPreview kind={kind} source={source} result={result} expanded />}
        </div>}
    </div>
  </ProductDocModal>;
}

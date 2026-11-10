"use client";

import { Button } from "@heroui/react";
import { X } from "lucide-react";
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
    className={className} bodyClassName={diagram ? styles.expandedContent : undefined}
    wrapperClassName={diagram ? styles.fullscreenWrapper : undefined} hideHeader={diagram}>
    {dismiss => <div className={styles.expandedBody}>
      {showSource ? <pre>{source}</pre> :
        <div className={styles.expandedPreview}>
          {diagram && <Button size="sm" variant="light" isIconOnly disableRipple className={styles.expandedClose}
            aria-label={closeLabel} onPress={dismiss}><X size={17} aria-hidden="true" /></Button>}
          {activity.phase && <StructuredBlockActions phase={activity.phase}
            label={locale === "ru" ? "Готовим предпросмотр" : "Preparing preview"} />}
          {activity.reveal && <ProductDocStructuredPreview kind={kind} source={source} result={result} expanded />}
        </div>}
    </div>}
  </ProductDocModal>;
}

"use client";

import type { CSSProperties } from "react";
import type { FolderAppearance } from "../../../../folders/model/appearance/folder-appearance";
import { FolderVisual } from "../../../../folders/presentation/appearance/visual/FolderVisual";
import type { ProductDocNode, ProductDocScope } from "../../../domain/product-docs";
import { sectionIcons, type SectionIconId } from "./section-icons";
import { useSectionAppearance } from "./state/useSectionAppearance";
import styles from "./section-appearance.module.css";

export function SectionVisual({ appearance, automatic, size = 18 }: {
  appearance: FolderAppearance;
  automatic: SectionIconId;
  size?: number;
}) {
  return <span className={styles.visual} data-section-icon={appearance?.kind === "icon" ? appearance.iconId : automatic}
    data-section-icon-tone={appearance ? "neutral" : sectionIcons[automatic]}
    aria-hidden="true" style={{ "--section-icon-size": size + "px" } as CSSProperties}>
    <FolderVisual appearance={appearance} fallbackIcon={automatic} />
  </span>;
}

export function ProductDocSectionIcon({ scope, node, size }: {
  scope: ProductDocScope;
  node: ProductDocNode;
  size?: number;
}) {
  return node.kind === "folder" ? <FolderIcon scope={scope} node={node} size={size} /> : null;
}

function FolderIcon({ scope, node, size }: { scope: ProductDocScope; node: ProductDocNode; size?: number }) {
  const { appearance, automatic } = useSectionAppearance(scope, node);
  return <SectionVisual appearance={appearance} automatic={automatic} size={size} />;
}

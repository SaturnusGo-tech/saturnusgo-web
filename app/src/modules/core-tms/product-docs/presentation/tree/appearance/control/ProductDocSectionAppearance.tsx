"use client";

import type { TmsLocale } from "../../../../../localization/model/locale";
import { FolderAppearancePopover } from "../../../../../folders/presentation/appearance/control/FolderAppearanceControl";
import type { ProductDocNode, ProductDocScope } from "../../../../domain/product-docs";
import { SectionVisual } from "../ProductDocSectionIcon";
import { useSectionAppearance } from "../state/useSectionAppearance";
import { useSectionAppearanceEditor } from "./useSectionAppearanceEditor";

export function ProductDocSectionAppearance({ scope, node, locale }: {
  scope: ProductDocScope;
  node: ProductDocNode;
  locale: TmsLocale;
}) {
  const { appearance, automatic, choose } = useSectionAppearance(scope, node);
  const ru = locale === "ru";
  const editor = useSectionAppearanceEditor(scope.projectId, appearance, choose, ru);
  return <FolderAppearancePopover key={node.id} name={node.title} ru={ru} appearance={appearance} editor={editor}
    defaultIcon={automatic} defaultColor="var(--falcon-icon)"
    resetLabel={ru ? "По названию раздела" : "Match section title"}
    renderVisual={(value) => <SectionVisual appearance={value ?? null} automatic={automatic} size={17} />} />;
}

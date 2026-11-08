"use client";

import { useCallback, useRef } from "react";
import type { FolderAppearance } from "../../../../folders/model/appearance/folder-appearance";
import type { TmsLocale } from "../../../../localization/model/locale";
import { FolderAppearancePopover } from "../../../../folders/presentation/appearance/control/FolderAppearanceControl";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import { SectionVisual } from "./ProductDocSectionIcon";
import { useSectionAppearance } from "../../../state/appearance/useSectionAppearance";
import { useSectionAppearanceEditor } from "../../../state/appearance/useSectionAppearanceEditor";

export function ProductDocSectionAppearance({ api, scope, node, locale, onChanged }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  node: ProductDocNode;
  locale: TmsLocale;
  onChanged(): void;
}) {
  const { appearance, automatic } = useSectionAppearance(scope, node);
  const { workspaceId, projectId } = scope;
  const { id, draftVersion } = node;
  const version = useRef(draftVersion);
  version.current = Math.max(version.current, draftVersion);
  const save = useCallback(async (next: FolderAppearance, recheckVersion: boolean) => {
    const target = { workspaceId, projectId };
    if (recheckVersion) version.current = (await api.get(target, id, { draft: true })).draftVersion;
    const result = await api.setAppearance(target, id, { appearance: next, expectedDraftVersion: version.current });
    version.current = result.draftVersion;
  }, [api, workspaceId, projectId, id]);
  const ru = locale === "ru";
  const editor = useSectionAppearanceEditor(projectId, appearance, save, onChanged, ru);
  return <FolderAppearancePopover key={node.id} name={node.title} ru={ru} appearance={appearance} editor={editor}
    defaultIcon={automatic} defaultColor="var(--falcon-icon)"
    resetLabel={ru ? "По названию раздела" : "Match section title"}
    renderVisual={(value) => <SectionVisual appearance={value ?? null} automatic={automatic} size={17} />} />;
}

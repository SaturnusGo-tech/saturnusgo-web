"use client";
import { AnchoredPopover as Popover } from "../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";

import { Button, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import type { FolderAppearance } from "../../../../folders/model/appearance/folder-appearance";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import { SectionVisual } from "./ProductDocSectionIcon";
import { useSectionAppearance } from "../../../state/appearance/useSectionAppearance";
import { useSectionAppearanceEditor } from "../../../state/appearance/useSectionAppearanceEditor";
import styles from "./section-appearance.module.css";

const Picker = lazy(() => import("../../../../folders/presentation/appearance/picker/FolderAppearancePicker")
  .then((module) => ({ default: module.FolderAppearancePicker })));

export function ProductDocSectionAppearance({ api, scope, node, locale, onChanged }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  node: ProductDocNode;
  locale: TmsLocale;
  onChanged(): void;
}) {
  const { appearance, automatic } = useSectionAppearance(scope, node);
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
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
  const label = ru ? "Оформление папки" : "Folder appearance";
  const current = editor.busy || editor.failed || open ? editor.preview : appearance;
  return <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-start" offset={6} containerPadding={12}
    shouldBlockScroll={false} shouldCloseOnScroll={false} disableAnimation={Boolean(reducedMotion)}
    classNames={{ content: styles.picker }} style={{ zIndex: 160 }}>
    <PopoverTrigger>
      <Button isIconOnly size="sm" variant="light" className={styles.trigger}
        aria-label={`${label}: ${node.title}`} title={label} data-failed={editor.failed || undefined}>
        <SectionVisual appearance={current ?? null} automatic={automatic} size={17} />
      </Button>
    </PopoverTrigger>
    <PopoverContent aria-label={label}>
      <Suspense fallback={<p className={styles.loading} role="status">{ru ? "Загрузка…" : "Loading…"}</p>}>
        <Picker folder={{ appearance }} ru={ru} editor={editor} defaultIcon={automatic} defaultColor="var(--falcon-icon)"
          resetLabel={ru ? "По названию раздела" : "Match section title"} />
      </Suspense>
    </PopoverContent>
  </Popover>;
}

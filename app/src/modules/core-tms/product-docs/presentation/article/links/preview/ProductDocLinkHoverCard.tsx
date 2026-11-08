"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import type { ProductDocLinkPreview } from "../../../../domain/product-docs";
import type { ProductDocSmartTarget } from "../../../../navigation/product-doc-smart-link";
import { ProductDocLinkPreviewContent } from "./ProductDocLinkPreviewContent";
import styles from "../smart-link.module.css";

export function ProductDocLinkHoverCard({ trigger, id, href, authoredText, hint, target, preview, workspaceId, portalContainer,
  onPointerEnter, onPointerLeave, onClose }: {
  trigger: RefObject<HTMLElement | null>;
  id: string;
  href: string;
  authoredText?: string;
  hint?: string;
  target: ProductDocSmartTarget | null;
  preview: ProductDocLinkPreview | null | undefined;
  workspaceId?: string;
  portalContainer?: HTMLElement;
  onPointerEnter(): void;
  onPointerLeave(): void;
  onClose(): void;
}) {
  const { locale } = useTmsLocale();
  const reducedMotion = useReducedMotion();
  return <FreeSoloPopover isOpen disableDialogFocus isNonModal shouldBlockScroll={false} shouldCloseOnBlur={false}
    onOpenChange={open => { if (!open) onClose(); }} triggerRef={trigger as RefObject<HTMLElement>} portalContainer={portalContainer}
    placement="top-start" offset={4} containerPadding={10} classNames={{ base: styles.previewOverlay, content: styles.preview }}
    disableAnimation={Boolean(reducedMotion)} style={{ zIndex: 162 }}>
    <div id={id} role="tooltip" className={styles.hitArea} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <ProductDocLinkPreviewContent href={href} locale={locale} target={target} preview={preview}
        authoredText={authoredText} hint={hint} workspaceId={workspaceId} />
    </div>
  </FreeSoloPopover>;
}

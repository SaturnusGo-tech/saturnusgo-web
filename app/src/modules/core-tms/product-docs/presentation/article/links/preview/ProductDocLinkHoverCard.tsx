"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { useEffect, useState, type RefObject } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import type { ProductDocLinkPreview } from "../../../../domain/product-docs";
import type { ProductDocSmartTarget } from "../../../../navigation/product-doc-smart-link";
import { ProductDocLinkPreviewContent } from "./ProductDocLinkPreviewContent";
import styles from "../smart-link.module.css";

export function ProductDocLinkHoverCard({ trigger, anchor, id, href, authoredText, hint, target, preview, previewPending, workspaceId, portalContainer,
  onPointerEnter, onPointerLeave, onClose }: {
  trigger: RefObject<HTMLElement | null>;
  anchor: HTMLAnchorElement;
  id: string;
  href: string;
  authoredText?: string;
  hint?: string;
  target: ProductDocSmartTarget | null;
  preview: ProductDocLinkPreview | null | undefined;
  previewPending: boolean;
  workspaceId?: string;
  portalContainer?: HTMLElement;
  onPointerEnter(): void;
  onPointerLeave(): void;
  onClose(): void;
}) {
  const { locale } = useTmsLocale();
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    if (!previewPending) return;
    const timeout = setTimeout(() => setShowFallback(true), 400);
    return () => clearTimeout(timeout);
  }, [previewPending]);

  if (previewPending && !showFallback) return null;
  return <FreeSoloPopover isOpen disableDialogFocus disableAnimation isNonModal shouldBlockScroll={false} shouldCloseOnBlur={false}
    isKeyboardDismissDisabled
    onOpenChange={open => { if (!open) onClose(); }} triggerRef={trigger as RefObject<HTMLElement>} portalContainer={portalContainer}
    placement="top-start" offset={4} containerPadding={10} classNames={{ base: styles.previewOverlay, content: styles.preview }}
    updatePositionDeps={[anchor]} style={{ zIndex: 162 }}>
    <div id={id} role="tooltip" className={styles.hitArea} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <ProductDocLinkPreviewContent href={href} locale={locale} target={target} preview={showFallback ? null : preview}
        authoredText={authoredText} hint={hint} workspaceId={workspaceId} />
    </div>
  </FreeSoloPopover>;
}

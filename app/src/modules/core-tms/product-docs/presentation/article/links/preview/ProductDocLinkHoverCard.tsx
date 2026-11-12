"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { useEffect, useState, type MouseEventHandler, type RefObject } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import type { ProductDocSmartPreview } from "../../../../domain/links/product-doc-smart-preview";
import type { ProductDocSmartTarget } from "../../../../navigation/product-doc-smart-link";
import { productDocLinkAction } from "../../../../navigation/links/product-doc-link-action";
import { ProductDocLinkPreviewContent } from "./ProductDocLinkPreviewContent";
import styles from "../smart-link.module.css";

export function ProductDocLinkHoverCard({ trigger, anchor, id, href, authoredText, hint, target, preview, previewPending, workspaceId, portalContainer,
  onPointerEnter, onPointerLeave, onClose, onFollow }: {
  trigger: RefObject<HTMLElement | null>;
  anchor: HTMLAnchorElement;
  id: string;
  href: string;
  authoredText?: string;
  hint?: string;
  target: ProductDocSmartTarget | null;
  preview: ProductDocSmartPreview | null | undefined;
  previewPending: boolean;
  workspaceId?: string;
  portalContainer?: HTMLElement;
  onPointerEnter(): void;
  onPointerLeave(): void;
  onClose(): void;
  onFollow: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { locale } = useTmsLocale();
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    setShowFallback(false);
    if (!previewPending) return;
    const timeout = setTimeout(() => setShowFallback(true), 400);
    return () => clearTimeout(timeout);
  }, [previewPending, href]);

  if (previewPending && !showFallback) return null;
  return <FreeSoloPopover isOpen disableDialogFocus disableAnimation isNonModal shouldBlockScroll={false} shouldCloseOnBlur={false}
    isKeyboardDismissDisabled
    onOpenChange={open => { if (!open) onClose(); }} triggerRef={trigger as RefObject<HTMLElement>} portalContainer={portalContainer}
    placement="top-start" offset={4} containerPadding={10} classNames={{ base: styles.previewOverlay, content: styles.preview }}
    updatePositionDeps={[anchor]} style={{ zIndex: 162 }}>
    <div id={id} role="group" aria-label={productDocLinkAction(target?.kind, locale === "ru")}
      className={styles.hitArea} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}
      onFocusCapture={onPointerEnter} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) onPointerLeave(); }}>
      <ProductDocLinkPreviewContent href={href} locale={locale} target={target} preview={preview}
        authoredText={authoredText} hint={hint} workspaceId={workspaceId} />
      <a className={styles.openAction} href={href} target={target?.kind === "external" ? "_blank" : undefined}
        rel={target?.kind === "external" ? "noopener noreferrer" : undefined}
        onClick={event => { onFollow(event); onClose(); }}>
        <span>{productDocLinkAction(target?.kind, locale === "ru")}</span>
        {target?.kind === "external" ? <ArrowUpRight size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
      </a>
    </div>
  </FreeSoloPopover>;
}

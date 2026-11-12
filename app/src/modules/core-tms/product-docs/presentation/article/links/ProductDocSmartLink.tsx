"use client";

import { useId, type ReactNode } from "react";
import { FileText } from "lucide-react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useProductDocLinkHover } from "../../../state/links/hover/useProductDocLinkHover";
import { useProductDocLinkPreview } from "../../../state/links/useProductDocLinkPreview";
import { ProductDocLinkHoverCard } from "./preview/ProductDocLinkHoverCard";
import { productDocLinkIcon, productDocLinkSummary } from "./preview/ProductDocLinkPreviewContent";
import styles from "./smart-link.module.css";
import { ProductDocRepositoryBreadcrumbs } from "./repository/ProductDocRepositoryBreadcrumbs";

export function ProductDocSmartLink({ href, title, children }: { href?: string; title?: string; children?: ReactNode }) {
  const { locale } = useTmsLocale();
  const { target, preview, previewPending, workspace, follow } = useProductDocLinkPreview(href);
  const hover = useProductDocLinkHover();
  const previewId = useId();
  if (!href) return <a>{children}</a>;
  const authoredText = typeof children === "string" ? children : undefined;
  const summary = productDocLinkSummary(href, locale, target, preview, authoredText);
  const external = target?.kind === "external";
  const label = target?.kind === "repository" && preview?.path?.length ? <ProductDocRepositoryBreadcrumbs path={preview.path} />
    : target?.kind === "document" ? summary.title
    : target?.kind === "case" ? preview?.title || summary.label || summary.title
    : authoredText ? summary.label || summary.title : children || summary.title;
  const document = target?.kind === "document";
  const Icon = document ? FileText : productDocLinkIcon(target?.kind, preview?.status);
  return <>
    <a className={styles.link} data-link-kind={target?.kind} href={href} target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined} aria-controls={hover.anchor ? previewId : undefined} aria-haspopup="dialog"
      onPointerEnter={event => { if (event.pointerType !== "touch") hover.show(event.currentTarget); }}
      onPointerLeave={event => hover.hide(event.currentTarget)}
      onFocus={event => { if (event.currentTarget.matches(":focus-visible")) hover.show(event.currentTarget, 0); }}
      onBlur={() => hover.hide()}
      onClick={event => {
        hover.close();
        follow(event);
      }}>
      <Icon size={14} data-link-status={document ? undefined : preview?.status} aria-hidden="true" /><span>{label}</span>
    </a>
    {hover.anchor && <ProductDocLinkHoverCard anchor={hover.anchor} trigger={hover.trigger} id={previewId} href={href} authoredText={authoredText} hint={title}
      target={target} preview={preview} previewPending={previewPending} workspaceId={workspace?.scope.workspaceId}
      onPointerEnter={hover.retain} onPointerLeave={() => hover.hide()} onClose={hover.close} onFollow={follow} />}
  </>;
}

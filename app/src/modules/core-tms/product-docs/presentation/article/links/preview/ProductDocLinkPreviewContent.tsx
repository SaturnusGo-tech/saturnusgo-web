"use client";

import { BookOpen, CircleCheck, CircleDashed, CircleMinus, ExternalLink, FolderOpen, Link2, ListChecks } from "lucide-react";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { localizedLabel } from "../../../../../localization/format/labels";
import { ResponsibleName } from "../../../../../workspace/members/presentation/ResponsibleName";
import type { ProductDocSmartPreview } from "../../../../domain/links/product-doc-smart-preview";
import type { ProductDocSmartTarget } from "../../../../navigation/product-doc-smart-link";
import styles from "../smart-link.module.css";
import { ProductDocRepositoryBreadcrumbs } from "../repository/ProductDocRepositoryBreadcrumbs";

export function productDocLinkSummary(href: string, locale: TmsLocale, target: ProductDocSmartTarget | null,
  preview: ProductDocSmartPreview | null | undefined, authoredText: string | undefined) {
  const ru = locale === "ru";
  const domain = target?.kind === "external" ? new URL(target.url).hostname : undefined;
  const kindLabel = target?.kind === "case" ? (ru ? "Тест-кейс" : "Test case")
    : target?.kind === "document" ? (ru ? "Документация" : "Documentation")
      : target?.kind === "repository" ? (ru ? "Репозиторий" : "Repository") : (ru ? "Ссылка" : "Link");
  const label = authoredText?.trim() === href ? undefined : authoredText?.trim();
  const title = preview?.title || label || domain || kindLabel;
  const status = preview?.status === "published" ? (ru ? "Опубликовано" : "Published")
    : preview?.status ? localizedLabel(locale, preview.status) : null;
  return { title, label, status, priority: preview?.priority && localizedLabel(locale, preview.priority),
    source: preview?.host || domain || preview?.path?.join(" / ") || kindLabel };
}

export function productDocLinkIcon(kind: ProductDocSmartTarget["kind"] | undefined, status: string | undefined) {
  if (status === "ready" || status === "published") return CircleCheck;
  if (status === "draft") return CircleDashed;
  if (status === "archived" || status === "deprecated") return CircleMinus;
  return kind === "case" ? ListChecks : kind === "document" ? BookOpen : kind === "repository" ? FolderOpen : kind === "external" ? ExternalLink : Link2;
}

function LinkPriorityIcon({ priority }: { priority: string | undefined }) {
  return <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true" data-link-priority={priority}>
    <rect x="1" y="8" width="3" height="5" rx="1" />
    <rect x="5.5" y="5" width="3" height="8" rx="1" opacity={priority === "low" ? .45 : 1} />
    <rect x="10" y="1" width="3" height="12" rx="1" opacity={priority === "low" || priority === "medium" ? .45 : 1} />
  </svg>;
}

export function ProductDocLinkPreviewContent({ href, locale, target, preview, authoredText, hint, workspaceId }: {
  href: string;
  locale: TmsLocale;
  target: ProductDocSmartTarget | null;
  preview: ProductDocSmartPreview | null | undefined;
  authoredText?: string;
  hint?: string;
  workspaceId?: string;
}) {
  const { title, source, status, priority } = productDocLinkSummary(href, locale, target, preview, authoredText);
  const Icon = productDocLinkIcon(target?.kind, preview?.status);
  const description = preview?.description || (hint !== title ? hint : undefined);
  return <div className={styles.previewContent}>
    <div className={styles.previewMeta}>
      <span className={styles.source} title={source}>{preview?.key || (preview?.path?.length
        ? <ProductDocRepositoryBreadcrumbs path={preview.path} /> : source)}</span>
      {preview?.ownerIdentityId && workspaceId && <span className={styles.owner}>
        <ResponsibleName workspaceId={workspaceId} identityId={preview.ownerIdentityId} />
      </span>}
    </div>
    <strong>{title}</strong>
    {description && <span className={styles.description}>{description}</span>}
    {(status || priority) && <div className={styles.details}>
      {status && <span><Icon size={14} data-link-status={preview?.status} aria-hidden="true" />{status}</span>}
      {priority && <span><LinkPriorityIcon priority={preview?.priority} />{priority}</span>}
    </div>}
  </div>;
}

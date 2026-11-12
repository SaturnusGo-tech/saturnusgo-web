"use client";

import { Button } from "@heroui/react";
import { Check, ChevronRight, Copy, ExternalLink, Pencil, Unlink } from "lucide-react";
import { useState } from "react";
import { writeClipboardText } from "../../../../../../../shared/lib/clipboard";
import { useProductDocLinkPreview } from "../../../../state/links/useProductDocLinkPreview";
import { ProductDocLinkPreviewContent } from "../../../article/links/preview/ProductDocLinkPreviewContent";
import styles from "../link-dialog.module.css";
import { productDocLinkAction } from "../../../../navigation/links/product-doc-link-action";

export function ProductDocSelectedLinkPreview({ href, url, ru, onEdit, onRemove }: {
  href?: string; url: string; ru: boolean; onEdit(): void; onRemove(): void;
}) {
  const [status, setStatus] = useState<"copied" | "failed">();
  const { preview, target, workspace, follow } = useProductDocLinkPreview(href);
  const external = target?.kind === "external";
  const ActionIcon = target?.kind === "document" ? ChevronRight : ExternalLink;
  const copyLabel = status === "copied" ? (ru ? "Ссылка скопирована" : "Link copied")
    : status === "failed" ? (ru ? "Не удалось скопировать ссылку" : "Couldn't copy link")
      : (ru ? "Скопировать ссылку" : "Copy link");
  return <div className={styles.linkDetails}>
    <ProductDocLinkPreviewContent href={url} locale={ru ? "ru" : "en"} target={target} preview={preview}
      workspaceId={workspace?.scope.workspaceId} />
    <div className={styles.preview}>
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} onClick={follow}>
        <ActionIcon size={13} aria-hidden="true" /><span>{productDocLinkAction(target?.kind, ru)}</span>
      </a>
      <Button type="button" isIconOnly disableRipple onPointerDown={(event) => event.preventDefault()} onPress={onEdit}
        aria-label={ru ? "Редактировать ссылку" : "Edit link"} title={ru ? "Редактировать ссылку" : "Edit link"}>
        <Pencil size={15} aria-hidden="true" />
      </Button>
      <Button type="button" isIconOnly disableRipple aria-label={copyLabel} title={copyLabel}
        onPointerDown={(event) => event.preventDefault()}
        onPress={() => { void writeClipboardText(url).then(() => setStatus("copied"), () => setStatus("failed")); }}>
        {status === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      </Button>
      <Button type="button" isIconOnly disableRipple onPointerDown={(event) => event.preventDefault()} onPress={onRemove}
        aria-label={ru ? "Удалить ссылку" : "Remove link"} title={ru ? "Удалить ссылку" : "Remove link"}>
        <Unlink size={15} aria-hidden="true" />
      </Button>
    </div>
  </div>;
}

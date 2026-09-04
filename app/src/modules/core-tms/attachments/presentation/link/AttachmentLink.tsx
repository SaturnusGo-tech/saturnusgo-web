"use client";

import { Paperclip, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { AttachmentMetadataResource } from "../../domain/attachment";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import {
  useAttachmentClient, useAttachmentReadCache, useAttachmentVisibility,
} from "../context/AttachmentClientProvider";
import { AttachmentMediaFrame } from "./AttachmentMediaFrame";
import styles from "./attachmentLink.module.css";

export function AttachmentLink({ attachmentId, presentation = "link", variant = "scenario" }: {
  attachmentId: string;
  presentation?: "link" | "media";
  variant?: "scenario" | "gallery";
}) {
  const attachments = useAttachmentClient();
  const readCache = useAttachmentReadCache();
  const visibility = useAttachmentVisibility();
  const { locale, t } = useTmsLocale();
  const [resource, setResource] = useState<AttachmentMetadataResource | null>(null);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewRequested, setPreviewRequested] = useState(false);
  const [retry, setRetry] = useState(0);
  const [removeOperationKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    let active = true;
    setFailed(false);
    readCache.getMetadata(attachmentId)
      .then((value) => { if (active) setResource(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attachmentId, readCache, retry]);

  useEffect(() => {
    if (!resource || resource.metadata.status === "ready" || retry >= 10) return;
    const timer = window.setTimeout(() => setRetry((value) => value + 1), 900 + retry * 180);
    return () => window.clearTimeout(timer);
  }, [resource, retry]);

  useEffect(() => {
    if (presentation !== "media" || !previewRequested || !resource
      || resource.metadata.status !== "ready" || (!resource.metadata.mimeType.startsWith("image/")
      && !resource.metadata.mimeType.startsWith("video/")
      && resource.metadata.mimeType !== "application/pdf")) return;
    let active = true;
    setOpening(true);
    setFailed(false);
    readCache.createAccess({ attachmentId, disposition: "inline" })
      .then((access) => {
        if (Object.keys(access.headers).length > 0) throw new Error("Unsupported signed headers");
        if (active) setPreviewUrl(access.url);
      })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setOpening(false); });
    return () => { active = false; };
  }, [attachmentId, presentation, previewRequested, readCache, resource, retry]);

  async function open() {
    if (!resource || resource.metadata.status !== "ready" || opening) return;
    setOpening(true);
    setFailed(false);
    try {
      const access = await readCache.createAccess({ attachmentId, disposition: "inline" });
      if (Object.keys(access.headers).length > 0) throw new Error("Unsupported signed headers");
      window.open(access.url, "_blank", "noopener,noreferrer");
    } catch {
      setFailed(true);
    } finally {
      setOpening(false);
    }
  }

  async function remove() {
    if (!resource || removing || !window.confirm(t("attachments.removeConfirm"))) return;
    setRemoving(true);
    setFailed(false);
    try {
      await attachments.remove({ attachmentId, etag: resource.etag, operationKey: removeOperationKey });
      readCache.invalidate(attachmentId);
      visibility.hide(attachmentId);
    } catch {
      setFailed(true);
    } finally {
      setRemoving(false);
    }
  }

  if (visibility.hiddenIds.has(attachmentId)) return null;
  if (failed) return <button className={styles.retry} type="button" onClick={() => {
    setResource(null);
    setPreviewUrl("");
    readCache.invalidate(attachmentId);
    setRetry((value) => value + 1);
  }}><Paperclip size={14} />{t("common.retry")}</button>;
  if (!resource) return <AttachmentSkeleton media={presentation === "media"} />;
  const isImage = resource.metadata.mimeType.startsWith("image/");
  const isVideo = resource.metadata.mimeType.startsWith("video/");
  const isPdf = resource.metadata.mimeType === "application/pdf";
  if (presentation === "media") {
    return <AttachmentMediaFrame
      name={resource.metadata.originalFilename}
      detail={formatBytes(resource.metadata.byteSize)}
      source={previewUrl}
      mediaType={isImage ? "image" : isVideo ? "video" : isPdf ? "pdf" : "file"}
      locale={locale}
      variant={variant}
      loading={opening}
      removing={removing}
      onOpen={() => void open()}
      onRemove={() => void remove()}
      onExpandedChange={(expanded) => { if (expanded) setPreviewRequested(true); }}
    />;
  }
  if (resource.metadata.status !== "ready") return <AttachmentSkeleton media={false} />;
  return <span className={styles.attachment}>
    <button type="button" onClick={() => void open()} disabled={opening}>
      <Paperclip size={14} />{resource.metadata.originalFilename}
    </button>
    <button type="button" onClick={() => void remove()} disabled={removing}
      aria-label={`${t("common.remove")} ${resource.metadata.originalFilename}`} title={t("common.remove")}>
      <Trash2 size={13} />
    </button>
  </span>;
}

function AttachmentSkeleton({ media }: { media: boolean }) {
  const content = <><span /><span /></>;
  return media
    ? <figure className={styles.mediaSkeleton} aria-hidden="true">{content}</figure>
    : <span className={styles.linkSkeleton} aria-hidden="true">{content}</span>;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

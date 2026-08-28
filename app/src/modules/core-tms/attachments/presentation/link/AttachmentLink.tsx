"use client";

import { Paperclip, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { AttachmentMetadataResource } from "../../domain/attachment";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useAttachmentClient, useAttachmentVisibility } from "../context/AttachmentClientProvider";

export function AttachmentLink({ attachmentId }: { attachmentId: string }) {
  const attachments = useAttachmentClient();
  const visibility = useAttachmentVisibility();
  const { t } = useTmsLocale();
  const [resource, setResource] = useState<AttachmentMetadataResource | null>(null);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [removeOperationKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    attachments.getMetadata(attachmentId, controller.signal)
      .then((value) => { if (!controller.signal.aborted) setResource(value); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attachmentId, attachments, retry]);

  async function open() {
    if (!resource || resource.metadata.status !== "ready" || opening) return;
    setOpening(true);
    setFailed(false);
    try {
      const access = await attachments.createAccess({ attachmentId, disposition: "inline" });
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
      visibility.hide(attachmentId);
    } catch {
      setFailed(true);
    } finally {
      setRemoving(false);
    }
  }

  if (visibility.hiddenIds.has(attachmentId)) return null;
  if (failed) return <button type="button" onClick={() => { setResource(null); setRetry((value) => value + 1); }}><Paperclip size={14} />{t("common.retry")}</button>;
  if (!resource) return <span><Paperclip size={14} />{t("common.loading")}</span>;
  if (resource.metadata.status !== "ready") return null;
  return <span>
    <button type="button" onClick={() => void open()} disabled={opening}>
      <Paperclip size={14} />{resource.metadata.originalFilename}
    </button>
    <button type="button" onClick={() => void remove()} disabled={removing}
      aria-label={`${t("common.remove")} ${resource.metadata.originalFilename}`} title={t("common.remove")}>
      <Trash2 size={13} />
    </button>
  </span>;
}

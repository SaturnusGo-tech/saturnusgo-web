import { useEffect, useState } from "react";
import { useOptionalAttachmentClient } from "../../../../attachments/presentation/context/AttachmentClientProvider";
import { useProductDocsWorkspace } from "../../../composition/context/ProductDocsContext";
import { productDocImageAttachmentId } from "./codec/productDocImageReference";
import { fetchProductDocImage } from "./fetch/productDocImageFetch";

export function productDocImageSource(value: string | undefined) {
  const address = value?.trim();
  if (!address || /[\t\r\n\\]/.test(address) || typeof window === "undefined") return null;
  try {
    const url = new URL(address, window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    if (url.username || url.password || (url.protocol !== "https:" && !(sameOrigin && url.protocol === "http:"))) return null;
    return { url, sameOrigin };
  } catch {
    return null;
  }
}

export function directImageLink(text: string) {
  if (!/^(?:https?:\/\/|\/(?!\/))\S+$/i.test(text.trim())) return null;
  const source = productDocImageSource(text);
  if (!source) return null;
  const { url, sameOrigin } = source;
  const raster = /\.(?:avif|gif|ico|jpe?g|png|webp)$/i.test(url.pathname);
  if (!raster && !(sameOrigin && /\.svg$/i.test(url.pathname))) return null;
  return sameOrigin ? url.pathname + url.search + url.hash : url.href;
}

export function useProductDocImage(src: string | undefined, loadExternal: boolean) {
  const client = useOptionalAttachmentClient();
  const projectId = useProductDocsWorkspace()?.scope.projectId;
  const attachmentId = productDocImageAttachmentId(src);
  const address = attachmentId ? null : productDocImageSource(src);
  const localUrl = address?.sameOrigin ? address.url.href : null;
  const remoteUrl = address && !address.sameOrigin ? address.url.href : null;
  const sourceUrl = localUrl ?? (loadExternal ? remoteUrl : null);
  const key = attachmentId ? (projectId ?? "") + ":" + attachmentId : sourceUrl;
  const [result, setResult] = useState<{ key: string; src: string | null } | null>(null);
  useEffect(() => {
    if (!key) return;
    const request = new AbortController();
    let objectUrl: string | null = null;
    const load = async () => {
      if (attachmentId && client && projectId) {
        const { metadata } = await client.getMetadata(attachmentId, request.signal);
        if (metadata.projectId !== projectId || metadata.owner.kind !== "project"
          || metadata.status !== "ready" || !metadata.mimeType.startsWith("image/")) return null;
        const access = await client.createAccess({ attachmentId, disposition: "inline", signal: request.signal });
        return access.url;
      }
      if (!sourceUrl) return null;
      const blob = await fetchProductDocImage(sourceUrl, Boolean(localUrl), request.signal);
      if (!blob) return null;
      request.signal.throwIfAborted();
      objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    };
    void load().then((url) => {
      if (!request.signal.aborted) setResult({ key, src: url });
    }, () => {
      if (!request.signal.aborted) setResult({ key, src: null });
    });
    return () => {
      request.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId, client, key, localUrl, projectId, sourceUrl]);
  const resolved = result?.key === key ? result : null;
  return {
    src: resolved?.src,
    remoteUrl,
    pending: Boolean(key && !resolved),
    unavailable: Boolean((key && resolved && !resolved.src) || (!key && !remoteUrl)),
  };
}

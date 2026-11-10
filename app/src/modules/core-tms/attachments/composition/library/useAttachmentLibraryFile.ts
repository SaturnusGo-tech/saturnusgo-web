import { useCallback } from "react";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { readProductDocAttachmentFile } from "../../../product-docs/data/attachments/productDocAttachmentApi";
import type { PrivateAttachmentClient } from "../../application/private-attachment-client";
import { getLibraryAttachmentUrl } from "../../data/library/attachment-library";
import type { LibraryAttachment } from "../../domain/library/attachment-library";

export function useAttachmentLibraryFile(http: TmsHttpClient | null, client: PrivateAttachmentClient | null, selected: LibraryAttachment | null) {
  const loadFile = useCallback(async (signal: AbortSignal) => {
    if (!selected || !http || !client) throw new Error("Attachment access is unavailable");
    const url = await getLibraryAttachmentUrl(http, client, selected, "inline", signal);
    const response = await fetch(url, { credentials: "omit", redirect: "error", referrerPolicy: "no-referrer", cache: "no-store", signal });
    if (!response.ok) throw new Error("Could not read file");
    if (Number(response.headers.get("Content-Length")) > selected.byteSize) {
      await response.body?.cancel();
      throw new Error("Attachment exceeds its registered size");
    }
    if (!response.body) return response.blob();
    let bytes = 0;
    const body = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, stream) {
        bytes += chunk.byteLength;
        if (bytes > selected.byteSize) throw new Error("Attachment exceeds its registered size");
        stream.enqueue(chunk);
      },
    }));
    return new Response(body, { headers: response.headers }).blob();
  }, [client, http, selected]);

  const loadDocumentText = useCallback(async (signal: AbortSignal) => {
    if (!http || !selected?.projectId) throw new Error("Attachment access is unavailable");
    const file = await readProductDocAttachmentFile(http, {
      workspaceId: selected.workspaceId, projectId: selected.projectId, docId: selected.source.id, draft: selected.source.draft,
    }, selected.id, signal);
    if (file.preview?.type !== "text") throw new Error("Text preview is unavailable");
    return file.preview;
  }, [http, selected]);

  return { loadFile, loadDocumentText, async getDownloadUrl() {
    if (!http || !client || !selected) throw new Error("Attachment access is unavailable");
    return getLibraryAttachmentUrl(http, client, selected, "attachment");
  } };
}

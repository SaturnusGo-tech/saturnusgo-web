"use client";

import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { readProductDocAttachmentFile, uploadProductDocAttachment } from "../../data/attachments/productDocAttachmentApi";
import { productDocAttachmentPattern } from "../../domain/attachments/productDocAttachment";
import type { ProductDocEmbedScope } from "../../domain/embeds/productDocEmbedScope";
import { useProductDocResource } from "../useProductDocResource";

export function useProductDocAttachmentFile(scope: ProductDocEmbedScope | null, attachment: string) {
  const http = useOptionalTmsHttpClient();
  const request = useMemo(() => http && scope && productDocAttachmentPattern.test(attachment)
    ? (signal: AbortSignal) => readProductDocAttachmentFile(http, scope, attachment, signal) : undefined, [attachment, http, scope]);
  return { request, resource: useProductDocResource(request) };
}

export function useUploadProductDocAttachment(scope: ProductDocEmbedScope | null) {
  const http = useOptionalTmsHttpClient();
  return useMemo(() => http && scope?.draft
    ? (file: File, filename: string, idempotencyKey: string, signal: AbortSignal) =>
      uploadProductDocAttachment(http, scope, file, filename, idempotencyKey, signal)
    : undefined, [http, scope]);
}

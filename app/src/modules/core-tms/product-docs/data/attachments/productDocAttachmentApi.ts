import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { productDocAttachmentPattern, type ProductDocAttachment } from "../../domain/attachments/productDocAttachment";
import { setProductDocEmbedRevision, type ProductDocEmbedScope } from "../../domain/embeds/productDocEmbedScope";

const path = ({ workspaceId, projectId, docId }: ProductDocEmbedScope) =>
  `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/product-docs/${encodeURIComponent(docId)}/attachments`;

export async function uploadProductDocAttachment(http: TmsHttpClient, scope: ProductDocEmbedScope, file: File,
  filename: string, idempotencyKey: string, signal: AbortSignal) {
  if (!http.binary) throw new Error("File upload is unavailable");
  const query = new URLSearchParams({ filename });
  const response = await http.binary(`${path(scope)}?${query}`, file, signal,
    { contentType: "application/octet-stream", accept: "application/json", idempotencyKey });
  const { data } = await response.json() as { data: ProductDocAttachment };
  if (!productDocAttachmentPattern.test(data.id)) throw new Error("Invalid file upload response");
  return data.id;
}

export async function readProductDocAttachmentFile(http: TmsHttpClient, scope: ProductDocEmbedScope, attachment: string, signal: AbortSignal) {
  if (!productDocAttachmentPattern.test(attachment)) throw new Error("Invalid file reference");
  const query = new URLSearchParams();
  setProductDocEmbedRevision(query, scope);
  const { data } = await http.getResource<ProductDocAttachment>(`${path(scope)}/${attachment}${query.size ? `?${query}` : ""}`, signal);
  if (data.id !== attachment) throw new Error("Invalid file response");
  return data;
}

import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { readProductDocAttachmentFile } from "../../../product-docs/data/attachments/productDocAttachmentApi";
import type { PrivateAttachmentClient } from "../../application/private-attachment-client";

import type { AttachmentLibraryKind, AttachmentLibraryPage, LibraryAttachment } from "../../domain/library/attachment-library";

type CatalogQuery = {
  search?: string;
  kind?: AttachmentLibraryKind;
  uploader?: "me" | "others";
  ids?: readonly string[];
  cursor?: string;
  limit?: number;
};

export function listLibraryAttachments(http: TmsHttpClient, workspaceId: string, filters: CatalogQuery, signal: AbortSignal) {
  if (filters.ids?.length === 0) return Promise.resolve<AttachmentLibraryPage>({ data: [], meta: { limit: 1, nextCursor: null, hasMore: false } });
  const query = new URLSearchParams({ limit: String(filters.limit ?? filters.ids?.length ?? 50) });
  if (filters.search) query.set("search", filters.search);
  if (filters.kind) query.set("kind", filters.kind);
  if (filters.uploader) query.set("uploader", filters.uploader);
  if (filters.ids) query.set("ids", filters.ids.join(","));
  if (filters.cursor) query.set("cursor", filters.cursor);
  return http.get<AttachmentLibraryPage>(`/workspaces/${encodeURIComponent(workspaceId)}/attachment-library?${query}`, signal);
}

export async function getLibraryAttachmentUrl(
  http: TmsHttpClient,
  client: PrivateAttachmentClient,
  file: LibraryAttachment,
  disposition: "inline" | "attachment",
  signal?: AbortSignal,
) {
  if (file.source.kind !== "product_doc") {
    return (await client.createAccess({ attachmentId: file.id, disposition, signal })).url;
  }
  if (!file.projectId) throw new Error("Missing attachment project");
  const access = await readProductDocAttachmentFile(http, {
    workspaceId: file.workspaceId, projectId: file.projectId, docId: file.source.id, draft: file.source.draft,
  }, file.id, signal ?? new AbortController().signal);
  const url = new URL(disposition === "inline" ? access.url : access.downloadUrl);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid attachment URL");
  return url.href;
}

import type { AttachmentMetadata } from "../../../attachments/domain/attachment";
export function mergeOrganizationAttachments(confirmed: readonly AttachmentMetadata[], authoritative: readonly AttachmentMetadata[]) {
  const merged = new Map(confirmed.map((item) => [item.id, item]));
  authoritative.forEach((item) => merged.set(item.id, item));
  return [...merged.values()].filter((item) => item.status !== "deleted" && item.status !== "deleting");
}

import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { attachmentDtoMapper } from "../../../attachments/data/attachment-dto-mapper";
import type { OrganizationTarget } from "../../management/model/organization";
export async function listOrganizationAttachments(http: TmsHttpClient, target: OrganizationTarget, cursor: string | null, signal: AbortSignal) {
  const query = new URLSearchParams({ limit: "100" });
  if (target.targetType === "portfolio") query.set("portfolioId", target.targetId);
  else { query.set("projectId", target.targetId); query.set("owner[kind]", "project"); query.set("owner[projectId]", target.targetId); }
  if (cursor) query.set("cursor", cursor);
  const result = await http.get<components["schemas"]["AttachmentListEnvelope"]>(`/attachments?${query}`, signal);
  return { items: result.data.map(attachmentDtoMapper.metadata),
    nextCursor: result.meta.hasMore ? result.meta.nextCursor : null };
}

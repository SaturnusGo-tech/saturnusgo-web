import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { mapExternalLink } from "./external-link-mapper";

type Api = components["schemas"];

export async function listExternalLinks(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ projectId, limit: "100" });
  const envelope = await http.get<Api["ExternalLinkListEnvelope"]>(`/links?${query}`, signal);
  return { items: envelope.data.map(mapExternalLink), meta: envelope.meta };
}

export async function getExternalLink(http: TmsHttpClient, linkId: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["ExternalLink"]>(`/links/${linkId}`, signal);
  return { data: mapExternalLink(resource.data), etag: resource.etag };
}

export async function createExternalLinkResource(
  http: TmsHttpClient,
  body: Api["ExternalLinkCreateRequest"],
  idempotencyKey: string,
): Promise<{ id: string; data: import("../../../../core/tms/contracts/legacy-contract").ExternalLink; etag: string | null }> {
  const resource = await http.mutateResource<Api["ExternalLink"]>(
    "/links",
    "POST",
    body,
    { idempotencyKey },
  );
  return { id: resource.data.id, data: mapExternalLink(resource.data), etag: resource.etag };
}

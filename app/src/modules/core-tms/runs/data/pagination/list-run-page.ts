import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

type Api = components["schemas"];

export function listRunPage(http: TmsHttpClient, projectId: string, options: {
  cursor?: string | null; limit: number; includeArchived?: boolean; signal?: AbortSignal;
}) {
  const query = new URLSearchParams({ projectId, limit: String(options.limit) });
  if (options.includeArchived) query.set("includeArchived", "true");
  if (options.cursor) query.set("cursor", options.cursor);
  return http.get<Api["RunListEnvelope"]>(`/runs?${query}`, options.signal);
}

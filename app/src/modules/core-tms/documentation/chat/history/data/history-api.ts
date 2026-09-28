import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { GuideChatSummary, GuideChatTurn, GuideChatShare, GuideSharedAnswer, GuidePage } from "../model/history";
import type { GuideHistoryApi } from "../model/api";

export function guideHistoryApi(http: TmsHttpClient, workspaceId: string): GuideHistoryApi {
  const workspace = `/workspaces/${encodeURIComponent(workspaceId)}/ai`;
  const base = `${workspace}/documentation-chats`, path = (id: string) => `${base}/${encodeURIComponent(id)}`;
  async function one<T>(url: string, signal?: AbortSignal) { return (await http.get<{ data: T }>(url, signal)).data; }
  async function page<T>(url: string, cursor: string | null, signal?: AbortSignal, query = ""): Promise<GuidePage<T>> {
    const params = new URLSearchParams({ limit: "20" });
    if (cursor) params.set("cursor", cursor); if (query) params.set("q", query);
    const result = await http.get<{ data: T[]; meta: { nextCursor: string | null } }>(`${url}?${params}`, signal);
    return { items: result.data, nextCursor: result.meta.nextCursor };
  }
  return {
    list: (query: string, cursor: string | null, signal?: AbortSignal) => page<GuideChatSummary>(base, cursor, signal, query),
    create: (body: components["schemas"]["DocumentationChatCreateRequest"], signal?: AbortSignal) => http.mutate<GuideChatSummary>(base, "POST", body, signal),
    rename: async (id, body, signal) => (await http.mutateResource<GuideChatSummary>(path(id), "PATCH", body,
      { signal, ifMatch: `"${body.expectedVersion}"` })).data,
    archive: (id, body, signal) => http.mutate<GuideChatSummary>(`${path(id)}/archive`, "POST", body, signal),
    chat: (id: string, signal?: AbortSignal) => one<GuideChatSummary>(path(id), signal),
    turns: (id: string, cursor: string | null, signal?: AbortSignal) => page<GuideChatTurn>(`${path(id)}/turns`, cursor, signal),
    turn: (id: string, turnId: string, signal?: AbortSignal) => one<GuideChatTurn>(`${path(id)}/turns/${encodeURIComponent(turnId)}`, signal),
    stream: (id: string, body: components["schemas"]["DocumentationChatTurnRequest"], signal: AbortSignal) => {
      if (!http.stream) return Promise.reject(new Error("Streaming transport is unavailable"));
      return http.stream(`${path(id)}/turns/stream`, body, signal);
    },
    cancel: (id: string, turnId: string) => http.mutate<GuideChatTurn>(`${path(id)}/turns/${encodeURIComponent(turnId)}/cancel`, "POST", {}),
    shares: (id: string, cursor: string | null, signal?: AbortSignal) => page<GuideChatShare>(`${path(id)}/shares`, cursor, signal),
    share: (id: string, turnId: string, body: components["schemas"]["DocumentationChatShareRequest"], signal?: AbortSignal) =>
      http.mutate<GuideChatShare>(`${path(id)}/turns/${encodeURIComponent(turnId)}/share`, "POST", body, signal),
    revoke: async (id: string, shareId: string, signal?: AbortSignal) => { await http.mutateResource<void>(`${path(id)}/shares/${encodeURIComponent(shareId)}`, "DELETE", undefined, { signal, ifMatch: "*" }); },
    shared: (id: string, signal?: AbortSignal) => one<GuideSharedAnswer>(`${workspace}/documentation-shares/${encodeURIComponent(id)}`, signal),
  };
}

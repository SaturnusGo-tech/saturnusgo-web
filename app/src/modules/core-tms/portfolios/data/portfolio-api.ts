import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { CatalogPage, Portfolio, PortfolioDraft } from "../model/portfolio";
import { mapPortfolio } from "./portfolio-mapper";

type Api = components["schemas"];

export async function listPortfolios(http: TmsHttpClient, workspaceId: string, status: Portfolio["status"], cursor: string | null, signal?: AbortSignal): Promise<CatalogPage<Portfolio>> {
  const query = new URLSearchParams({ workspaceId, status, limit: "100" });
  if (cursor) query.set("cursor", cursor);
  const result = await http.get<Api["PortfolioListEnvelope"]>(`/portfolios?${query}`, signal);
  return { items: result.data.map(mapPortfolio), nextCursor: result.meta.hasMore ? result.meta.nextCursor : null };
}

export async function getPortfolio(http: TmsHttpClient, id: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["Portfolio"]>(`/portfolios/${encodeURIComponent(id)}`, signal);
  return { data: mapPortfolio(resource.data), etag: resource.etag };
}

export async function savePortfolio(http: TmsHttpClient, workspaceId: string, draft: PortfolioDraft, current: { id: string; etag: string | null } | null, operationKey: string, signal?: AbortSignal) {
  if (current && !current.etag) throw new Error("Portfolio ETag is required.");
  const fields = { name: draft.name.trim(), description: draft.description.trim(), responsibleIdentityId: draft.responsibleIdentityId,
    ...(draft.workflowPhase !== undefined ? { workflowPhase: draft.workflowPhase } : {}),
    ...(draft.checklist !== undefined ? { checklist: draft.checklist.map((item) => ({ ...item, text: item.text.trim() })) } : {}) };
  const body = current ? fields satisfies Api["PortfolioPatchRequest"] : { workspaceId, ...fields } satisfies Api["PortfolioCreateRequest"];
  const result = await http.mutateResource<Api["Portfolio"]>(current ? `/portfolios/${encodeURIComponent(current.id)}` : "/portfolios",
    current ? "PATCH" : "POST", body, { idempotencyKey: operationKey, ifMatch: current?.etag ?? undefined, signal });
  return { data: mapPortfolio(result.data), etag: result.etag };
}

export async function transitionPortfolio(http: TmsHttpClient, id: string, action: "archive" | "restore", etag: string, operationKey: string, signal?: AbortSignal) {
  const path = `/portfolios/${encodeURIComponent(id)}${action === "restore" ? "/restore" : ""}`;
  const result = await http.mutateResource<Api["Portfolio"]>(path, action === "restore" ? "POST" : "DELETE", undefined,
    { ifMatch: etag, idempotencyKey: operationKey, signal });
  return { data: mapPortfolio(result.data), etag: result.etag };
}

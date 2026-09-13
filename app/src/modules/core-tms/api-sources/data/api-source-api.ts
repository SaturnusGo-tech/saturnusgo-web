import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { ApiContext, ApiSource, ApiSourceDraft } from "../model/api-source";
import type { SwaggerSpecification } from "../../connectors/model/swagger/swagger-specification";
export function sourceQuery(workspaceId: string, context: ApiContext, catalog = false) {
  const query = new URLSearchParams({ workspaceId });
  if (catalog) query.set("catalog", "true");
  else if (context.portfolioId) query.set("portfolioId", context.portfolioId);
  else if (context.projectIds?.length) query.set("projectIds", [...context.projectIds].sort().join(","));
  return query;
}
export async function listApiSources(http: TmsHttpClient, workspaceId: string, context: ApiContext, catalog: boolean, signal: AbortSignal) {
  const result: ApiSource[] = []; const query = sourceQuery(workspaceId, context, catalog);
  const cursors = new Set<string>();
  for (;;) {
    const page = await http.get<components["schemas"]["ApiSourceList"]>(`/integrations/api-sources?${query}`, signal);
    result.push(...page.data);
    if (!page.nextCursor) return result;
    if (cursors.has(page.nextCursor) || result.length > 1000) throw new Error("API catalog pagination did not advance");
    cursors.add(page.nextCursor);
    signal.throwIfAborted(); query.set("before", page.nextCursor);
  }
}
export async function readApiSpecification(http: TmsHttpClient, workspaceId: string, sourceId: string, context: ApiContext, signal: AbortSignal) {
  return (await http.get<{ data: SwaggerSpecification }>(`/integrations/api-sources/${encodeURIComponent(sourceId)}/specification?${sourceQuery(workspaceId, context)}`, signal)).data;
}
export async function saveApiSource(http: TmsHttpClient, workspaceId: string, source: ApiSource | null, draft: ApiSourceDraft, key: string, signal: AbortSignal) {
  const path = `/integrations/api-sources${source ? `/${encodeURIComponent(source.id)}` : ""}?${new URLSearchParams({ workspaceId })}`;
  return (await http.mutateResource<ApiSource>(path, source ? "PATCH" : "POST", draft,
    { signal, idempotencyKey: source ? undefined : key, ifMatch: source ? `"api-source:${source.id}:${source.rowVersion}"` : undefined })).data;
}

import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { setProductDocEmbedRevision, type ProductDocEmbedScope } from "../../domain/embeds/productDocEmbedScope";

import type { CaptureProductDocRunInput, RunEvidencePage, RunEvidenceQuery } from "../../domain/run/productDocRunCandidates";

type Contract = components["schemas"];
type RunEvidence = Contract["ProductDocRunEmbed"];
const candidateFilters = ["results", "folders", "components", "productGroups", "products", "regression", "types", "priorities", "statuses", "owners", "tags"] as const;

const path = ({ workspaceId, projectId, docId }: ProductDocEmbedScope) =>
  `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/product-docs/${encodeURIComponent(docId)}/run-embeds`;

export async function readProductDocRun(http: TmsHttpClient, scope: ProductDocEmbedScope, id: string, signal: AbortSignal) {
  const query = new URLSearchParams();
  setProductDocEmbedRevision(query, scope);
  const { data } = await http.getResource<RunEvidence>(
    `${path(scope)}/${encodeURIComponent(id)}${query.size ? `?${query}` : ""}`, signal,
  );
  if (data.id !== id || !Number.isFinite(Date.parse(data.capturedAt)) || !Number.isFinite(Date.parse(data.runCreatedAt))) {
    throw new Error("Invalid run evidence response");
  }
  return data;
}

export async function captureProductDocRun(
  http: TmsHttpClient, scope: ProductDocEmbedScope, input: CaptureProductDocRunInput, signal: AbortSignal,
) {
  const { data } = await http.mutateResource<Contract["ProductDocRunEmbedCapture"]>(path(scope), "POST", input, { signal });
  if (data.runId !== input.runId || (input.runProjectId && input.runProjectId !== (data.runProjectId ?? scope.projectId))) {
    throw new Error("Unexpected run evidence");
  }
  return data.id;
}

export async function listProductDocRuns(
  http: TmsHttpClient, scope: ProductDocEmbedScope, query: RunEvidenceQuery, cursor: string | null, signal: AbortSignal,
): Promise<RunEvidencePage> {
  const params = new URLSearchParams({ limit: "25" });
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.ql?.trim()) params.set("ql", query.ql.trim());
  for (const id of query.projects ?? []) params.append("projectIds", id);
  for (const field of candidateFilters) {
    for (const value of query[field] ?? []) params.append(field, value);
  }
  if (cursor) params.set("cursor", cursor);
  const { data, meta } = await http.get<Contract["ProductDocRunCandidatesEnvelope"]>(
    `${path(scope)}/candidates?${params}`, signal,
  );
  if (meta.hasMore && (!meta.nextCursor || meta.nextCursor === cursor)) throw new Error("Run candidate pagination did not advance");
  return { items: data, nextCursor: meta.hasMore ? meta.nextCursor : null };
}

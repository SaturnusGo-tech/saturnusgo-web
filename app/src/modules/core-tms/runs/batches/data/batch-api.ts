import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { mapRun } from "../../data/run-mapper";
import type { RunBatch, RunBatchRequest, RunBatchTransition } from "../model/batch";
type Api = components["schemas"];
const base = (workspaceId: string) => `/workspaces/${encodeURIComponent(workspaceId)}`;
const map = (dto: Api["RunBatch"]): RunBatch => ({ ...dto,
  runs: dto.runs.map((run) => ({ ...mapRun(run), rowVersion: run.rowVersion })) });
async function pages<T>(http: TmsHttpClient, path: string, signal?: AbortSignal) {
  const items: T[] = []; const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    signal?.throwIfAborted();
    const page: { data: T[]; meta: { nextCursor: string | null } } = await http.get(
      `${path}?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, signal);
    items.push(...page.data); cursor = page.meta.nextCursor;
    if (cursor && (seen.has(cursor) || seen.size >= 499)) throw new Error("Run pagination did not complete.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return items;
}
export async function listRunBatches(http: TmsHttpClient, workspaceId: string, signal?: AbortSignal) {
  return (await pages<Api["RunBatch"]>(http, `${base(workspaceId)}/run-batches`, signal)).map(map);
}
export async function getRunBatch(http: TmsHttpClient, workspaceId: string, id: string, signal?: AbortSignal) {
  const resource = await http.get<{ data: Api["RunBatch"] }>(`${base(workspaceId)}/run-batches/${encodeURIComponent(id)}`, signal);
  return map(resource.data);
}
export function listRunIterations(http: TmsHttpClient, workspaceId: string, signal?: AbortSignal) {
  return pages<Api["RunIteration"]>(http, `${base(workspaceId)}/run-iterations`, signal);
}
export async function createRunBatch(http: TmsHttpClient, workspaceId: string, body: RunBatchRequest, key: string) {
  const resource = await http.mutateResource<Api["RunBatch"]>(`${base(workspaceId)}/run-batches`, "POST", body, { idempotencyKey: key });
  return map(resource.data);
}
export async function transitionRunBatch(http: TmsHttpClient, workspaceId: string, id: string,
  body: RunBatchTransition, key: string, signal?: AbortSignal) {
  const resource = await http.mutateResource<Api["RunBatch"]>(`${base(workspaceId)}/run-batches/${encodeURIComponent(id)}/transition`,
    "POST", body, { idempotencyKey: key, signal });
  return map(resource.data);
}

import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import {
  mapRun, mapRunAttempt, mapRunAttemptSummary, mapRunItem, mapRunItemSummary,
} from "./run-mapper";

type Api = components["schemas"];
export type RunHistoryPageRequest = {
  readonly cursor?: string;
  readonly limit?: number;
  readonly signal?: AbortSignal;
};

export async function listRuns(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ projectId, limit: "100" });
  const envelope = await http.get<Api["RunListEnvelope"]>(`/runs?${query}`, signal);
  return { items: envelope.data.map(mapRun), meta: envelope.meta };
}

export async function getRun(http: TmsHttpClient, runId: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["Run"]>(`/runs/${runId}`, signal);
  return { data: mapRun(resource.data), etag: resource.etag };
}

export async function listRunItems(http: TmsHttpClient, runId: string, signal?: AbortSignal) {
  const envelope = await http.get<Api["RunItemListEnvelope"]>(
    `/runs/${runId}/items?limit=100`, signal,
  );
  return { items: envelope.data.map(mapRunItemSummary), meta: envelope.meta };
}

export async function getRunItem(
  http: TmsHttpClient,
  runId: string,
  itemId: string,
  signal?: AbortSignal,
) {
  const resource = await http.getResource<Api["RunItem"]>(
    `/runs/${runId}/items/${itemId}`, signal,
  );
  return { data: mapRunItem(resource.data), etag: resource.etag };
}

export async function listRunAttempts(
  http: TmsHttpClient,
  runId: string,
  itemId: string,
  request: RunHistoryPageRequest = {},
) {
  const query = new URLSearchParams({ limit: String(request.limit ?? 100) });
  if (request.cursor) query.set("cursor", request.cursor);
  const envelope = await http.get<Api["RunAttemptListEnvelope"]>(
    `/runs/${runId}/items/${itemId}/attempts?${query}`, request.signal,
  );
  return { items: envelope.data.map(mapRunAttemptSummary), meta: envelope.meta };
}

export async function getRunAttempt(
  http: TmsHttpClient,
  runId: string,
  itemId: string,
  attemptNo: number,
  signal?: AbortSignal,
) {
  const path = `/runs/${runId}/items/${itemId}/attempts/${attemptNo}`;
  return mapRunAttempt((await http.getResource<Api["RunAttempt"]>(path, signal)).data);
}

export async function createRun(http: TmsHttpClient, body: Api["RunCreateRequest"], key: string) {
  const resource = await http.mutateResource<Api["Run"]>(
    "/runs", "POST", body, { idempotencyKey: key },
  );
  return { data: mapRun(resource.data), etag: resource.etag };
}

export async function transitionRun(
  http: TmsHttpClient,
  runId: string,
  transition: "start" | "complete" | "abort",
  etag: string,
  key: string,
  body?: unknown,
  signal?: AbortSignal,
) {
  const resource = await http.mutateResource<Api["Run"]>(
    `/runs/${runId}/${transition}`, "POST", body,
    { ifMatch: etag, idempotencyKey: key, signal },
  );
  return { data: mapRun(resource.data), etag: resource.etag };
}

export async function retestRunItem(
  http: TmsHttpClient,
  runId: string,
  itemId: string,
  etag: string,
  key: string,
  signal?: AbortSignal,
) {
  const resource = await http.mutateResource<Api["RunItem"]>(
    `/runs/${runId}/items/${itemId}/retest`, "POST", undefined,
    { ifMatch: etag, idempotencyKey: key, signal },
  );
  return { data: mapRunItem(resource.data), etag: resource.etag };
}

export async function updateRunItem(
  http: TmsHttpClient,
  runId: string,
  itemId: string,
  body: Api["RunItemStatusUpdateRequest"],
  etag: string,
  key: string,
) {
  await http.mutateResource<Api["RunItem"]>(
    `/runs/${runId}/items/${itemId}/status`, "PATCH", body,
    { ifMatch: etag, idempotencyKey: key },
  );
  return await getRunItem(http, runId, itemId);
}

export async function updateRunStep(
  http: TmsHttpClient,
  runId: string,
  itemId: string,
  stepId: string,
  body: Api["StepResultUpdateRequest"],
  etag: string,
  key: string,
) {
  await http.mutateResource<Api["StepResultMutation"]>(
    `/runs/${runId}/items/${itemId}/steps/${stepId}`, "PATCH", body,
    { ifMatch: etag, idempotencyKey: key },
  );
  return await getRunItem(http, runId, itemId);
}

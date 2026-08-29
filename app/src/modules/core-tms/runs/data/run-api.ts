import type { components } from "../../../../core/tms/generated/tms-api";
import type { RunItem } from "../../../../core/tms/contracts/legacy-contract";
import { TmsApiError, type TmsHttpClient } from "../../../../core/tms/transport/http";
import { collectCursorPages } from "./pagination/collect-cursor-pages";
import { mapRun, mapRunAttempt, mapRunAttemptSummary, mapRunItem, mapRunItemSummary } from "./run-mapper";

type Api = components["schemas"];
const LIST_PAGE_SIZE = 100;
const LIST_ITEM_LIMIT = 10_000;
const LIST_PAGE_LIMIT = 100;
export type RunHistoryPageRequest = { readonly cursor?: string; readonly limit?: number;
  readonly signal?: AbortSignal };

export async function listRuns(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const page = await collectCursorPages<Api["Run"], Api["PageMeta"]>(async (cursor) => {
    const query = new URLSearchParams({
      projectId, limit: String(LIST_PAGE_SIZE), includeArchived: "true",
    });
    if (cursor) query.set("cursor", cursor);
    return http.get<Api["RunListEnvelope"]>(`/runs?${query}`, signal);
  }, {
    maxItems: LIST_ITEM_LIMIT, maxPages: LIST_PAGE_LIMIT,
    resourceLabel: "Workspace run list", signal,
  });
  return { items: page.items.map(mapRun), meta: page.meta };
}

export async function getRun(http: TmsHttpClient, runId: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["Run"]>(`/runs/${runId}`, signal);
  return { data: mapRun(resource.data), etag: resource.etag };
}

function requiredRunEtag(etag: string | null) { if (!etag) throw new Error("Run ETag is required for mutation."); return etag; }

export async function mutateRunWithEtagRecovery<T>(
  http: TmsHttpClient, runId: string, currentEtag: string | null,
  mutate: (etag: string) => Promise<T>, signal?: AbortSignal,
) {
  const initialEtag = currentEtag ?? requiredRunEtag((await getRun(http, runId, signal)).etag);
  try {
    return await mutate(initialEtag);
  } catch (error) {
    if (!(error instanceof TmsApiError) || error.status !== 412) throw error;
    const refreshed = await getRun(http, runId, signal);
    return await mutate(requiredRunEtag(refreshed.etag));
  }
}

export async function listRunItems(http: TmsHttpClient, runId: string, signal?: AbortSignal) {
  const page = await collectCursorPages<Api["RunItemSummary"], Api["PageMeta"]>(async (cursor) => {
    const query = new URLSearchParams({ limit: String(LIST_PAGE_SIZE) });
    if (cursor) query.set("cursor", cursor);
    return http.get<Api["RunItemListEnvelope"]>(
      `/runs/${runId}/items?${query}`, signal,
    );
  }, {
    maxItems: LIST_ITEM_LIMIT, maxPages: LIST_PAGE_LIMIT,
    resourceLabel: "Run-item list", signal,
  });
  return { items: page.items.map(mapRunItemSummary), meta: page.meta };
}

export async function getRunItem(http: TmsHttpClient, runId: string, itemId: string,
  signal?: AbortSignal) {
  const resource = await http.getResource<Api["RunItem"]>(`/runs/${runId}/items/${itemId}`, signal);
  return { data: mapRunItem(resource.data), etag: resource.etag };
}

export async function listRunAttempts(
  http: TmsHttpClient, runId: string, itemId: string, request: RunHistoryPageRequest = {},
) {
  const query = new URLSearchParams({ limit: String(request.limit ?? 100) });
  if (request.cursor) query.set("cursor", request.cursor);
  const envelope = await http.get<Api["RunAttemptListEnvelope"]>(
    `/runs/${runId}/items/${itemId}/attempts?${query}`, request.signal);
  return { items: envelope.data.map(mapRunAttemptSummary), meta: envelope.meta };
}

export async function getRunAttempt(http: TmsHttpClient, runId: string, itemId: string,
  attemptNo: number, signal?: AbortSignal) {
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

export async function archiveRun(
  http: TmsHttpClient,
  runId: string,
  etag: string,
  key: string,
  reason?: string,
  signal?: AbortSignal,
) {
  const body: Api["RunArchiveRequest"] | undefined = reason ? { reason } : undefined;
  const resource = await http.mutateResource<Api["Run"]>(
    `/runs/${runId}`, "DELETE", body,
    { ifMatch: etag, idempotencyKey: key, signal },
  );
  return { data: mapRun(resource.data), etag: resource.etag };
}

export async function restoreRun(
  http: TmsHttpClient,
  runId: string,
  etag: string,
  key: string,
  signal?: AbortSignal,
) {
  const resource = await http.mutateResource<Api["Run"]>(
    `/runs/${runId}/restore`, "POST", undefined,
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
  const resource = await http.mutateResource<Api["RunItem"]>(
    `/runs/${runId}/items/${itemId}/status`, "PATCH", body,
    { ifMatch: etag, idempotencyKey: key },
  );
  if (!resource.etag) throw new Error("Run item mutation ETag is required.");
  if (resource.data.id !== itemId) {
    throw new Error("Run item mutation response does not match the requested resource.");
  }
  return { data: mapRunItem(resource.data), etag: resource.etag };
}

export async function updateRunStep(
  http: TmsHttpClient,
  runId: string,
  itemId: string,
  stepId: string,
  body: Api["StepResultUpdateRequest"],
  currentItem: RunItem,
  etag: string,
  key: string,
) {
  const resource = await http.mutateResource<Api["StepResultMutation"]>(
    `/runs/${runId}/items/${itemId}/steps/${stepId}`, "PATCH", body,
    { ifMatch: etag, idempotencyKey: key },
  );
  if (!resource.etag) throw new Error("Run step mutation ETag is required.");
  const mutation = resource.data;
  if (mutation.runId !== runId || mutation.runItemId !== itemId ||
      mutation.result.stepId !== stepId) {
    throw new Error("Run step mutation response does not match the requested resource.");
  }
  const data = structuredClone(currentItem);
  const attempt = data.attempts.find((entry) => entry.attemptNo === mutation.attemptNo);
  const index = attempt?.stepResults.findIndex((entry) => entry.stepId === stepId) ?? -1;
  if (!attempt || index < 0) throw new Error("Run step mutation target is missing locally.");
  attempt.stepResults[index] = {
    ...mutation.result, attachmentIds: [...mutation.result.attachmentIds],
  };
  return { data, etag: resource.etag };
}

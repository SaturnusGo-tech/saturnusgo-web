import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type {
  SharedStep, SharedStepDraft, SharedStepSummary,
} from "../model/shared-step";

type Api = components["schemas"];
const summary = (value: Api["SharedStepSummary"]): SharedStepSummary => ({ ...value });
const resource = (value: Api["SharedStep"], etag: string | null): SharedStep => ({
  ...value, etag: etag ?? `"shared-step:${value.id}:v${value.currentRevision}"`,
  current: { ...value.current, items: value.current.items.map((item, index) => ({
    ...item, id: item.id ?? `shared-item-${index + 1}`, order: item.order ?? index + 1,
    testData: item.testData ?? "", attachmentIds: [...item.attachmentIds],
  })) },
});
const body = (draft: SharedStepDraft): Api["SharedStepWriteRequest"] => ({
  title: draft.title, changeNote: draft.changeNote, folderId: draft.folderId,
  items: draft.items.map(({ id, order, action, expectedResult, testData, required, attachmentIds }) => ({
    id, order, action, expectedResult, testData, required, attachmentIds: [...attachmentIds],
  })),
});

export async function listSharedSteps(http: TmsHttpClient, projectId: string,
  signal?: AbortSignal): Promise<SharedStepSummary[]> {
  const items = new Map<string, SharedStepSummary>();
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    signal?.throwIfAborted();
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const envelope = await http.get<Api["SharedStepListEnvelope"]>(
      `/projects/${encodeURIComponent(projectId)}/shared-steps?${query}`, signal);
    signal?.throwIfAborted();
    envelope.data.forEach(value => items.set(value.id, summary(value)));
    cursor = envelope.meta.nextCursor;
    if (envelope.meta.hasMore && !cursor) throw new Error("Shared-step pagination cursor is missing.");
    if (cursor && seen.has(cursor)) throw new Error("Shared-step pagination did not advance.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return [...items.values()];
}

export async function getSharedStep(http: TmsHttpClient, projectId: string,
  id: string, signal?: AbortSignal): Promise<SharedStep> {
  const result = await http.getResource<Api["SharedStep"]>(
    `/projects/${encodeURIComponent(projectId)}/shared-steps/${encodeURIComponent(id)}`, signal);
  return resource(result.data, result.etag);
}

export async function createSharedStep(http: TmsHttpClient, projectId: string,
  draft: SharedStepDraft, operationKey = crypto.randomUUID()): Promise<SharedStep> {
  const result = await http.mutateResource<Api["SharedStep"]>(
    `/projects/${encodeURIComponent(projectId)}/shared-steps`, "POST", body(draft),
    { idempotencyKey: operationKey });
  return resource(result.data, result.etag);
}

export async function reviseSharedStep(http: TmsHttpClient, value: SharedStep,
  draft: SharedStepDraft, operationKey = crypto.randomUUID()): Promise<SharedStep> {
  const result = await http.mutateResource<Api["SharedStep"]>(
    `/projects/${encodeURIComponent(value.projectId)}/shared-steps/${encodeURIComponent(value.id)}`,
    "PATCH", body(draft), { ifMatch: value.etag, idempotencyKey: operationKey });
  return resource(result.data, result.etag);
}

export async function archiveSharedStep(http: TmsHttpClient, value: SharedStepSummary,
  operationKey: string, signal?: AbortSignal): Promise<SharedStep> {
  const result = await http.mutateResource<Api["SharedStep"]>(
    `/projects/${encodeURIComponent(value.projectId)}/shared-steps/${encodeURIComponent(value.id)}/archive`,
    "POST", undefined, { ifMatch: value.etag, idempotencyKey: operationKey, signal });
  return resource(result.data, result.etag);
}

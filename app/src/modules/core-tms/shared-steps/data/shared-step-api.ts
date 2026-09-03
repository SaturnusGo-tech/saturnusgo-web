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
  title: draft.title, changeNote: draft.changeNote,
  items: draft.items.map(({ id, order, action, expectedResult, testData, required }) => ({
    id, order, action, expectedResult, testData, required,
  })),
});

export async function listSharedSteps(http: TmsHttpClient, projectId: string,
  signal?: AbortSignal): Promise<SharedStepSummary[]> {
  const envelope = await http.get<Api["SharedStepListEnvelope"]>(
    `/projects/${encodeURIComponent(projectId)}/shared-steps?limit=100`, signal);
  return envelope.data.map(summary);
}

export async function getSharedStep(http: TmsHttpClient, projectId: string,
  id: string, signal?: AbortSignal): Promise<SharedStep> {
  const result = await http.getResource<Api["SharedStep"]>(
    `/projects/${encodeURIComponent(projectId)}/shared-steps/${encodeURIComponent(id)}`, signal);
  return resource(result.data, result.etag);
}

export async function createSharedStep(http: TmsHttpClient, projectId: string,
  draft: SharedStepDraft): Promise<SharedStep> {
  const result = await http.mutateResource<Api["SharedStep"]>(
    `/projects/${encodeURIComponent(projectId)}/shared-steps`, "POST", body(draft),
    { idempotencyKey: crypto.randomUUID() });
  return resource(result.data, result.etag);
}

export async function reviseSharedStep(http: TmsHttpClient, value: SharedStep,
  draft: SharedStepDraft): Promise<SharedStep> {
  const result = await http.mutateResource<Api["SharedStep"]>(
    `/projects/${encodeURIComponent(value.projectId)}/shared-steps/${encodeURIComponent(value.id)}`,
    "PATCH", body(draft), { ifMatch: value.etag, idempotencyKey: crypto.randomUUID() });
  return resource(result.data, result.etag);
}

import type { components } from "../../../../core/tms/generated/tms-api";
import type { TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient, TmsResource } from "../../../../core/tms/transport/http";
import {
  mapRevisionSummary,
  mapTestCase,
  mapTestCaseRevision,
  mapTestCaseSummary,
} from "./test-case-mapper";

type Api = components["schemas"];
const LIST_PAGE_SIZE = 100;
const LIST_CASE_LIMIT = 10_000;
const LIST_PAGE_LIMIT = 100;
export type CaseWriteInput = {
  projectId: string;
  folderPath: string;
  revision: TestCaseRevision;
};
export type RevisionPageRequest = {
  readonly cursor?: string;
  readonly limit?: number;
  readonly signal?: AbortSignal;
};

function revisionWrite(revision: TestCaseRevision) {
  return {
    title: revision.title,
    description: revision.description,
    preconditions: revision.preconditions,
    type: revision.type,
    lifecycle: revision.lifecycle,
    priority: revision.priority,
    component: revision.component,
    ownerIdentityId: revision.ownerIdentityId,
    tags: revision.tags.filter(Boolean),
    estimatedMinutes: revision.estimatedMinutes,
    testData: revision.testData,
    steps: revision.steps.map(({ id, order, action, expectedResult, testData, required }) => (
      { id, order, action, expectedResult, testData, required }
    )),
    checklist: revision.checklist.map(({ id, order, text, required }) => (
      { id, order, text, required }
    )),
    changeNote: revision.changeNote,
  } satisfies Omit<Api["TestCasePatchRequest"], "folderPath">;
}

export async function listTestCases(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const items: Api["TestCaseSummary"][] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  let meta: Api["PageMeta"] = { limit: LIST_PAGE_SIZE, hasMore: false, nextCursor: null };
  for (let page = 0; page < LIST_PAGE_LIMIT; page += 1) {
    signal?.throwIfAborted();
    const query = new URLSearchParams({ projectId, limit: String(LIST_PAGE_SIZE) });
    if (cursor) query.set("cursor", cursor);
    const envelope = await http.get<Api["TestCaseListEnvelope"]>(`/test-cases?${query}`, signal);
    items.push(...envelope.data);
    meta = envelope.meta;
    if (items.length > LIST_CASE_LIMIT || (items.length >= LIST_CASE_LIMIT && meta.hasMore)) throw new Error("Test-case collection exceeds the supported 10,000-case workspace limit.");
    if (!meta.hasMore || !meta.nextCursor) return { items: items.map(mapTestCaseSummary), meta };
    if (seenCursors.has(meta.nextCursor)) throw new Error("Test-case pagination returned a repeated cursor.");
    seenCursors.add(meta.nextCursor);
    cursor = meta.nextCursor;
  }
  throw new Error("Test-case collection exceeds the supported 100-page workspace limit.");
}

export async function getTestCase(http: TmsHttpClient, caseId: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["TestCase"]>(`/test-cases/${caseId}`, signal);
  return { data: mapTestCase(resource.data), etag: resource.etag };
}

export async function listCaseRevisions(
  http: TmsHttpClient,
  caseId: string,
  request: RevisionPageRequest = {},
) {
  const query = new URLSearchParams({ limit: String(request.limit ?? 100) });
  if (request.cursor) query.set("cursor", request.cursor);
  const envelope = await http.get<Api["TestCaseRevisionListEnvelope"]>(
    `/test-cases/${caseId}/revisions?${query}`, request.signal,
  );
  return { items: envelope.data.map(mapRevisionSummary), meta: envelope.meta };
}

export async function getCaseRevision(
  http: TmsHttpClient,
  caseId: string,
  revision: number,
  signal?: AbortSignal,
) {
  const resource = await http.getResource<Api["TestCaseRevision"]>(
    `/test-cases/${caseId}/revisions/${revision}`, signal,
  );
  return mapTestCaseRevision(resource.data);
}

export async function createTestCase(
  http: TmsHttpClient,
  input: CaseWriteInput,
  idempotencyKey: string,
) {
  const body = { projectId: input.projectId, folderPath: input.folderPath, ...revisionWrite(input.revision) };
  return mapCaseMutation(await http.mutateResource<Api["TestCase"]>(
    "/test-cases", "POST", body satisfies Api["TestCaseCreateRequest"], { idempotencyKey },
  ));
}

export async function reviseTestCase(
  http: TmsHttpClient,
  caseId: string,
  input: CaseWriteInput,
  etag: string,
  idempotencyKey: string,
) {
  const body = { folderPath: input.folderPath, ...revisionWrite(input.revision) };
  return mapCaseMutation(await http.mutateResource<Api["TestCase"]>(
    `/test-cases/${caseId}`, "PATCH", body, { ifMatch: etag, idempotencyKey },
  ));
}

export async function transitionTestCase(
  http: TmsHttpClient,
  caseId: string,
  operation: "archive" | "restore",
  etag: string,
  idempotencyKey: string,
) {
  const path = operation === "restore" ? `/test-cases/${caseId}/restore` : `/test-cases/${caseId}`;
  const method = operation === "restore" ? "POST" : "DELETE";
  return mapCaseMutation(await http.mutateResource<Api["TestCase"]>(
    path, method, undefined, { ifMatch: etag, idempotencyKey },
  ));
}

export async function cloneTestCase(
  http: TmsHttpClient,
  caseId: string,
  idempotencyKey: string,
) {
  return mapCaseMutation(await http.mutateResource<Api["TestCase"]>(
    `/test-cases/${caseId}/clone`, "POST", {}, { idempotencyKey },
  ));
}

function mapCaseMutation(resource: TmsResource<Api["TestCase"]>) {
  return { data: mapTestCase(resource.data), etag: resource.etag };
}

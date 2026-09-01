import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type {
  CaseLinkedDefect, TestCaseComment,
} from "../model/test-case-collaboration";

type Api = components["schemas"];
const PAGE_SIZE = 50;

export async function listTestCaseComments(
  http: TmsHttpClient,
  projectId: string,
  caseId: string,
  cursor: string | null = null,
  signal?: AbortSignal,
) {
  const query = pageQuery(projectId, cursor);
  const page = await http.get<Api["TestCaseCommentListEnvelope"]>(
    `/test-cases/${caseId}/comments?${query}`, signal,
  );
  return { items: page.data.map(mapComment), meta: page.meta };
}

export async function createTestCaseComment(
  http: TmsHttpClient,
  projectId: string,
  caseId: string,
  body: string,
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["TestCaseComment"]>(
    `/test-cases/${caseId}/comments`, "POST",
    { projectId, body } satisfies Api["TestCaseCommentCreateRequest"],
    { idempotencyKey },
  );
  return mapComment(resource.data);
}

export async function listTestCaseDefects(
  http: TmsHttpClient,
  projectId: string,
  caseId: string,
  cursor: string | null = null,
  signal?: AbortSignal,
) {
  const query = pageQuery(projectId, cursor);
  const page = await http.get<Api["TestCaseLinkedDefectListEnvelope"]>(
    `/test-cases/${caseId}/defects?${query}`, signal,
  );
  return { items: page.data.map(mapLinkedDefect), meta: page.meta };
}

export async function confirmDefectFix(
  http: TmsHttpClient,
  defect: CaseLinkedDefect,
  idempotencyKey: string,
) {
  if (!defect.eligibleRetest) throw new Error("Retest evidence is required.");
  const {
    completedAt: _completedAt, testCaseId: _testCaseId, ...body
  } = defect.eligibleRetest;
  return await http.mutateResource<Api["DefectFixConfirmation"]>(
    `/defects/${defect.defectId}/confirm-fix`, "POST",
    body satisfies Api["DefectFixConfirmationRequest"],
    { ifMatch: defect.defectEtag, idempotencyKey },
  );
}

function mapComment(dto: Api["TestCaseComment"]): TestCaseComment {
  return { ...dto, author: { ...dto.author } };
}

function mapLinkedDefect(dto: Api["TestCaseLinkedDefect"]): CaseLinkedDefect {
  return {
    ...dto,
    occurrence: { ...dto.occurrence },
    youTrack: dto.youTrack ? { ...dto.youTrack } : null,
    youTrackCreation: dto.youTrackCreation ? { ...dto.youTrackCreation } : null,
    statusHistory: dto.statusHistory.map((event) => ({ ...event })),
    eligibleRetest: dto.eligibleRetest ? { ...dto.eligibleRetest } : null,
    fixVerification: dto.fixVerification ? { ...dto.fixVerification } : null,
    youTrackTransition: dto.youTrackTransition ? { ...dto.youTrackTransition } : null,
  };
}

function pageQuery(projectId: string, cursor: string | null) {
  const query = new URLSearchParams({ projectId, limit: String(PAGE_SIZE) });
  if (cursor) query.set("cursor", cursor);
  return query;
}

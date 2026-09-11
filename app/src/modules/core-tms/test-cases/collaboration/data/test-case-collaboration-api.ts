import { commentPath, discussionComment, type CommentTargetKind, type DiscussionCommentDto } from "./target/comment-target";
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
  targetKind: CommentTargetKind = "test_case",
) {
  const query = pageQuery(projectId, cursor);
  const page = await http.get<Omit<Api["TestCaseCommentListEnvelope"], "data"> & { data: DiscussionCommentDto[] }>(
    `${commentPath(caseId, targetKind)}?${query}`, signal,
  );
  return { items: page.data.map(discussionComment), meta: page.meta };
}

export async function createTestCaseComment(
  http: TmsHttpClient,
  projectId: string,
  caseId: string,
  body: string,
  idempotencyKey: string,
  options: Omit<import("../model/drafts/comment-draft").CommentDraft, "body"> = {},
  targetKind: CommentTargetKind = "test_case",
) {
  const resource = await http.mutateResource<DiscussionCommentDto>(
    commentPath(caseId, targetKind), "POST",
    { projectId, body, ...options } satisfies Api["TestCaseCommentCreateRequest"],
    { idempotencyKey },
  );
  return discussionComment(resource.data);
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
  options: Omit<import("../model/drafts/comment-draft").CommentDraft, "body"> = {},
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

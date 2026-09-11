import { commentPath, discussionComment, type CommentTargetKind, type DiscussionCommentDto } from "./target/comment-target";
import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TestCaseComment } from "../model/test-case-collaboration";
import type { CommentDraft } from "../model/drafts/comment-draft";
type Api = components["schemas"];
export async function changeComment(http: TmsHttpClient, projectId: string, caseId: string,
  comment: TestCaseComment, draft: CommentDraft | null, targetKind: CommentTargetKind = "test_case") {
  if (!comment.version) throw new Error("Refresh the comment before changing it.");
  const body = draft ? { projectId, version: comment.version, body: draft.body,
    mentions: draft.mentions ?? [], notifyChannels: draft.notifyChannels ?? [] } satisfies Api["TestCaseCommentUpdateRequest"]
    : { projectId, version: comment.version } satisfies Api["TestCaseCommentDeleteRequest"];
  const result = await http.mutateResource<DiscussionCommentDto>(
    `${commentPath(caseId, targetKind)}/${encodeURIComponent(comment.id)}`, draft ? "PATCH" : "DELETE", body,
    { ifMatch: `"comment-${comment.version}"` });
  return discussionComment(result.data);
}
export async function getComment(http: TmsHttpClient, projectId: string, caseId: string, id: string, targetKind: CommentTargetKind = "test_case") {
  const result = await http.getResource<DiscussionCommentDto>(
    `${commentPath(caseId, targetKind)}/${encodeURIComponent(id)}?${new URLSearchParams({projectId})}`);
  return discussionComment(result.data);
}

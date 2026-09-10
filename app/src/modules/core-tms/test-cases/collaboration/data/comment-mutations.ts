import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TestCaseComment } from "../model/test-case-collaboration";
import type { CommentDraft } from "../model/drafts/comment-draft";
type Api = components["schemas"];
export async function changeComment(http: TmsHttpClient, projectId: string, caseId: string,
  comment: TestCaseComment, draft: CommentDraft | null) {
  if (!comment.version) throw new Error("Refresh the comment before changing it.");
  const body = draft ? { projectId, version: comment.version, body: draft.body,
    mentions: draft.mentions ?? [], notifyChannels: draft.notifyChannels ?? [] } satisfies Api["TestCaseCommentUpdateRequest"]
    : { projectId, version: comment.version } satisfies Api["TestCaseCommentDeleteRequest"];
  const result = await http.mutateResource<Api["TestCaseComment"]>(
    `/test-cases/${caseId}/comments/${comment.id}`, draft ? "PATCH" : "DELETE", body,
    { ifMatch: `"comment-${comment.version}"` });
  return result.data;
}
export async function getComment(http: TmsHttpClient, projectId: string, caseId: string, id: string) {
  const result = await http.getResource<Api["TestCaseComment"]>(
    `/test-cases/${caseId}/comments/${encodeURIComponent(id)}?${new URLSearchParams({projectId})}`);
  return result.data;
}

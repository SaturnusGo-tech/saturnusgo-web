import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { TestCaseComment } from "../../model/test-case-collaboration";
export type CommentTargetKind = "test_case" | "defect";
export type DiscussionCommentDto = components["schemas"]["TestCaseComment"] | components["schemas"]["DefectComment"];
export const commentPath = (id: string, kind: CommentTargetKind = "test_case") => `/${kind === "defect" ? "defects" : "test-cases"}/${encodeURIComponent(id)}/comments`;
/** Adapt the resource-specific wire ID to the existing shared discussion view model. */
export function discussionComment(dto: DiscussionCommentDto): TestCaseComment {
 return { ...dto, caseId: "defectId" in dto ? dto.defectId : dto.caseId, author: { ...dto.author } };
}

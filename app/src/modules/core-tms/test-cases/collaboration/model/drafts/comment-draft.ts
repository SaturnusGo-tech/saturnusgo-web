import type { components } from "../../../../../../core/tms/generated/tms-api";
export type CommentDraft = Pick<components["schemas"]["TestCaseCommentCreateRequest"], "body" | "parentId" | "mentions" | "notifyChannels">;

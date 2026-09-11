import { buildDefectDeepLink } from "../../../defects/navigation/defect-deep-link";
import { buildCaseDeepLink } from "../case-deep-link";

export function buildCommentLink(href: string, input: {
  targetKind?: "test_case" | "defect"; workspaceId: string; projectId: string; caseId: string; id: string;
}) {
  const base = new URL("/testcases/umbrella-home/work/", href);
  base.searchParams.set("workspaceId", input.workspaceId);
  const url = new URL(input.targetKind === "defect" ? buildDefectDeepLink(base.href, { projectId: input.projectId, defectId: input.caseId }) : buildCaseDeepLink(base.href, input));
  url.searchParams.set("view", input.targetKind === "defect" ? "reports" : "cases");
  url.searchParams.set("commentId", input.id);
  return url.href;
}

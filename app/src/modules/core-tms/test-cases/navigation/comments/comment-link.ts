import { buildCaseDeepLink } from "../case-deep-link";

export function buildCommentLink(href: string, input: {
  workspaceId: string; projectId: string; caseId: string; id: string;
}) {
  const base = new URL("/testcases/umbrella-home/work/", href);
  const url = new URL(buildCaseDeepLink(base.href, input));
  url.searchParams.set("view", "cases");
  url.searchParams.set("commentId", input.id);
  return url.href;
}

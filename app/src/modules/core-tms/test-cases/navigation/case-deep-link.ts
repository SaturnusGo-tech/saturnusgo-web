import { isProjectCaseContext } from "./project/project-case-context";

const CASE_ID_PARAM = "caseId";
const PROJECT_ID_PARAM = "projectId";

export type CaseDeepLink = {
  caseId: string | null;
  projectId: string | null;
};

export function readCaseDeepLink(href: string): CaseDeepLink {
  const url = new URL(href);
  return {
    caseId: url.searchParams.get(CASE_ID_PARAM),
    projectId: url.searchParams.get(PROJECT_ID_PARAM),
  };
}

export function buildCaseDeepLink(
  href: string,
  input: { caseId: string; projectId: string; workspaceId?: string; folderId?: string | null },
  options: { preserveDefectSelection?: boolean; preserveProjectContext?: boolean; preserveCommentSelection?: boolean } = {},
) {
  const url = new URL(href);
  const embedded = options.preserveProjectContext && isProjectCaseContext(href, input.projectId)
    && (!input.workspaceId || input.workspaceId === url.searchParams.get("workspaceId"));
  const folderId = input.folderId === undefined ? url.searchParams.get("folderId") : input.folderId ?? "root";
  const projectTab = url.searchParams.get("projectTab");
  const workspaceId = input.workspaceId ?? url.searchParams.get("workspaceId");
  const commentId = options.preserveCommentSelection && url.searchParams.get(CASE_ID_PARAM) === input.caseId
    && url.searchParams.get(PROJECT_ID_PARAM) === input.projectId
    && url.searchParams.get("workspaceId") === workspaceId ? url.searchParams.get("commentId") : null;
  const defectId = options.preserveDefectSelection
    ? url.searchParams.get("defectId") : null;
  const legacyDefectId = options.preserveDefectSelection
    ? url.searchParams.get("defect") : null;
  const legacyReports = Boolean((defectId || legacyDefectId)
    && url.searchParams.get("view") === "reports");
  url.hash = "";
  url.search = "";
  if (workspaceId) url.searchParams.set("workspaceId", workspaceId);
  url.searchParams.set(PROJECT_ID_PARAM, input.projectId);
  url.searchParams.set(CASE_ID_PARAM, input.caseId);
  if (commentId && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(commentId)) url.searchParams.set("commentId", commentId);
  if (embedded) {
    url.searchParams.set("view", "portfolios"); url.searchParams.set("catalogProjectId", input.projectId);
    if (folderId && (input.folderId !== undefined || new URL(href).searchParams.get(PROJECT_ID_PARAM) === input.projectId)
      && /^[A-Za-z0-9._:-]{1,128}$/.test(folderId)) url.searchParams.set("folderId", folderId);
    if (projectTab && /^[a-z-]{1,30}$/.test(projectTab)) url.searchParams.set("projectTab", projectTab);
  }
  if (defectId) url.searchParams.set("defectId", defectId);
  if (legacyDefectId) url.searchParams.set("defect", legacyDefectId);
  if (legacyReports) url.searchParams.set("view", "reports");
  return url.toString();
}

export function clearCaseDeepLink(href: string) {
  const url = new URL(href);
  url.searchParams.delete(CASE_ID_PARAM);
  url.searchParams.delete(PROJECT_ID_PARAM);
  url.searchParams.delete("commentId");
  return url.toString();
}

const DEFECT_ID_PARAM = "defectId";
const LEGACY_DEFECT_ID_PARAM = "defect";
export const ARCHIVED_DEFECT_PARAM = "archivedDefect";

export function readDefectDeepLink(href: string) {
  const url = new URL(href);
  const defectId = url.searchParams.get(DEFECT_ID_PARAM) ?? url.searchParams.get(LEGACY_DEFECT_ID_PARAM);
  return {
    projectId: url.searchParams.get("projectId"),
    defectId,
    ...(defectId && url.searchParams.get(ARCHIVED_DEFECT_PARAM) === "true" ? { includeArchived: true } : {}),
  };
}

export function buildDefectDeepLink(
  href: string,
  input: { projectId: string; defectId: string | null; commentId?: string | null; includeArchived?: boolean },
) {
  const url = new URL(href);
  url.searchParams.set("projectId", input.projectId);
  url.searchParams.delete(LEGACY_DEFECT_ID_PARAM);
  url.searchParams.delete(ARCHIVED_DEFECT_PARAM);
  if (input.defectId) {
    url.hash = "";
    const workspaceId = url.searchParams.get("workspaceId");
    url.search = "";
    if (workspaceId) url.searchParams.set("workspaceId", workspaceId);
    url.searchParams.set("projectId", input.projectId);
    url.searchParams.set("view", "reports");
    url.searchParams.set(DEFECT_ID_PARAM, input.defectId);
    if (input.includeArchived) url.searchParams.set(ARCHIVED_DEFECT_PARAM, "true");
    if (input.commentId && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(input.commentId)) url.searchParams.set("commentId", input.commentId);
  } else {
    url.searchParams.delete(DEFECT_ID_PARAM);
    url.searchParams.delete("commentId");
  }
  return url.toString();
}

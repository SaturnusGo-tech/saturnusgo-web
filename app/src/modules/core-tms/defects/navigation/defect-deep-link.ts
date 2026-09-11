const DEFECT_ID_PARAM = "defectId";
const LEGACY_DEFECT_ID_PARAM = "defect";

export function readDefectDeepLink(href: string) {
  const url = new URL(href);
  return {
    projectId: url.searchParams.get("projectId"),
    defectId: url.searchParams.get(DEFECT_ID_PARAM)
      ?? url.searchParams.get(LEGACY_DEFECT_ID_PARAM),
  };
}

export function buildDefectDeepLink(
  href: string,
  input: { projectId: string; defectId: string | null; commentId?: string | null },
) {
  const url = new URL(href);
  url.searchParams.set("projectId", input.projectId);
  url.searchParams.delete(LEGACY_DEFECT_ID_PARAM);
  if (input.defectId) {
    url.hash = "";
    const workspaceId = url.searchParams.get("workspaceId");
    url.search = "";
    if (workspaceId) url.searchParams.set("workspaceId", workspaceId);
    url.searchParams.set("projectId", input.projectId);
    url.searchParams.set("view", "reports");
    url.searchParams.set(DEFECT_ID_PARAM, input.defectId);
    if (input.commentId && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(input.commentId)) url.searchParams.set("commentId", input.commentId);
  } else {
    url.searchParams.delete(DEFECT_ID_PARAM);
    url.searchParams.delete("commentId");
  }
  return url.toString();
}

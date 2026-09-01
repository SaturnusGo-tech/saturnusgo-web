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
  input: { projectId: string; defectId: string | null },
) {
  const url = new URL(href);
  url.searchParams.set("projectId", input.projectId);
  url.searchParams.delete(LEGACY_DEFECT_ID_PARAM);
  if (input.defectId) {
    url.searchParams.set(DEFECT_ID_PARAM, input.defectId);
  } else {
    url.searchParams.delete(DEFECT_ID_PARAM);
    if (url.searchParams.get("view") === "reports") url.searchParams.delete("view");
  }
  return url.toString();
}

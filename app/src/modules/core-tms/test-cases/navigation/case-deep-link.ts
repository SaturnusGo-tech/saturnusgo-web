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
  input: { caseId: string; projectId: string },
  options: { preserveDefectSelection?: boolean } = {},
) {
  const url = new URL(href);
  const defectId = options.preserveDefectSelection
    ? url.searchParams.get("defectId") : null;
  const legacyDefectId = options.preserveDefectSelection
    ? url.searchParams.get("defect") : null;
  const legacyReports = Boolean((defectId || legacyDefectId)
    && url.searchParams.get("view") === "reports");
  url.hash = "";
  url.search = "";
  url.searchParams.set(PROJECT_ID_PARAM, input.projectId);
  url.searchParams.set(CASE_ID_PARAM, input.caseId);
  if (defectId) url.searchParams.set("defectId", defectId);
  if (legacyDefectId) url.searchParams.set("defect", legacyDefectId);
  if (legacyReports) url.searchParams.set("view", "reports");
  return url.toString();
}

export function clearCaseDeepLink(href: string) {
  const url = new URL(href);
  url.searchParams.delete(CASE_ID_PARAM);
  url.searchParams.delete(PROJECT_ID_PARAM);
  return url.toString();
}

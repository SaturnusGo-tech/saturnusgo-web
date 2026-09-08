export const POSTMAN_WEB_URL = "https://web.postman.co/";
export function swaggerWorkspaceUrl(current: string, view: "api" | "hooks"): string {
  const url = new URL(current);
  for (const key of ["caseId", "runId", "runItemId", "defectId", "article", "analysisId", "impact", "integration"]) url.searchParams.delete(key);
  url.searchParams.set("view", view);
  if (view === "hooks") url.searchParams.set("integration", "swagger");
  return url.toString();
}

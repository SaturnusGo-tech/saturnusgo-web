import { readDrillRoute } from "../../presentation/dashboard/navigation/drill-route";

// Keep in step with Falcon Desktop's resource-address.cjs. Only navigation
// selectors travel through the OS; browser credentials and auth callbacks do not.
const selectors = new Set(["workspaceId", "projectId", "view", "caseId", "caseTab", "folderId", "suiteId", "runId", "runItemId",
  "attemptId", "stepId", "attachmentId", "defectId", "defect", "environmentId", "portfolioId", "catalogProjectId", "docId", "docVersion", "docSection",
  "commentId", "article", "tab", "page", "settings", "integration", "plugin", "pluginSetup", "lang", "includeArchived", "archived",
  "suiteEdit", "projectTab", "portfolioTab", "organizationCreate", "analysisId", "impact", "importFile", "repositoryScope",
  "repositoryPortfolioId", "repositoryProjectId"]);
const multiple = new Set(["repositoryPortfolioId", "repositoryProjectId"]);
const reserved = new Set(["sandbox", "admin", "www", "api", "mail", "support"]);
const safeId = /^[A-Za-z0-9._:-]{1,128}$/;

function trustedOrigin(url: URL): boolean {
  if (url.origin === "https://tms.saturnusgo.com") return true;
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)-falcon\.saturnusgo\.com$/.exec(url.hostname);
  return Boolean(match && match[1].length >= 2 && match[1].length <= 48 && !reserved.has(match[1]));
}

export function desktopResourceAddress(input: string): string | null {
  if (input.length > 8192 || /[\\\x00-\x20\x7f]/.test(input) || /%0[ad]/i.test(input)) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !trustedOrigin(url)
      || !["/work/", "/testcases/umbrella-home/work/"].includes(url.pathname)
      || url.searchParams.getAll("workspaceId").length !== 1 || !url.searchParams.get("workspaceId")) return null;
    for (const [key, value] of url.searchParams) {
      if (url.searchParams.getAll(key).length > (multiple.has(key) ? 32 : 1)) return null;
      if (key === "dashboardDetail") {
        if (!readDrillRoute(url.href)) return null;
      } else if (!selectors.has(key) || !safeId.test(value)) return null;
    }
    if (url.hash && !/^#[A-Za-z0-9_-]{1,128}$/.test(url.hash)) return null;
    url.pathname = "/work/";
    return url.href;
  } catch { return null; }
}

export function desktopResourceLink(input: string): string | null {
  const address = desktopResourceAddress(input);
  return address ? `falcon://open?${new URLSearchParams({ url: address })}` : null;
}

export function isDirectResourceEntry(input: string): boolean {
  const address = desktopResourceAddress(input);
  if (!address) return false;
  const query = new URL(address).searchParams;
  return Boolean(query.get("caseId") || query.get("folderId") || query.get("suiteId") || query.get("runId")
    || query.get("defectId") || query.get("defect") || query.get("docId") || query.get("dashboardDetail")
    || query.get("view") && query.get("view") !== "dashboard");
}

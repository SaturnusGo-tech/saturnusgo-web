import { isProjectCaseContext } from "../../test-cases/navigation/project/project-case-context";
import { isProvider } from "../../connectors/model/connector-types";
import { workspaceViews, type View } from "../types/workspace";

export function readWorkspaceDeepLink(href: string): { view: View | null; runId: string | null; runItemId?: string } {
  const query = new URL(href).searchParams;
  const view = query.get("view");
  const candidate = query.get("runId");
  const runId = candidate && /^[A-Za-z0-9._:-]{1,128}$/.test(candidate) ? candidate : null;
  const item = query.get("runItemId");
  const runSelection = { view: "runs" as const, runId,
    ...(runId && item && /^[A-Za-z0-9._:-]{1,128}$/.test(item) ? { runItemId: item } : {}) };
  if (view === "integrations") return { view: "cases", runId: null };
  if (view === "runs") return runSelection;
  if (view && workspaceViews.includes(view as View)) return { view: view as View, runId: null };
  if (query.get("defectId") || query.get("defect")) return { view: "reports", runId: null };
  if (runId) return runSelection;
  const integration = query.get("integration");
  if (integration && (isProvider(integration) || integration === "youtrack")) return { view: "hooks", runId: null };
  return { view: null, runId: null };
}

export function buildWorkspaceDeepLink(href: string, input: {
  workspaceId: string; projectId: string; view: View; runId: string | null; runItemId?: string | null;
}) {
  const url = new URL(href); const integration = url.searchParams.get("integration");
  const analysisId = url.searchParams.get("analysisId"); const impact = url.searchParams.get("impact");
  const detail = url.searchParams.get("dashboardDetail");
  const portfolioId = url.searchParams.get("portfolioId");
  const catalogProjectId = url.searchParams.get("catalogProjectId");
  const organizationCreate = url.searchParams.get("organizationCreate");
  const projectTab = url.searchParams.get("projectTab");
  const portfolioTab = url.searchParams.get("portfolioTab");
  const embeddedCases = isProjectCaseContext(href, input.projectId);
  const folderId = url.searchParams.get("folderId");
  const suiteId = url.searchParams.get("suiteId");
  const article = url.searchParams.get("article"); const section = url.hash;
  const defectId = url.searchParams.get("defectId") ?? url.searchParams.get("defect");
  const sameWorkspace = !url.searchParams.get("workspaceId") || url.searchParams.get("workspaceId") === input.workspaceId;
  const sameScope = ["workspaceId", "projectId"].every((key) => {
    const previous = url.searchParams.get(key);
    return !previous || previous === input[key as "workspaceId" | "projectId"];
  });
  url.search = ""; url.hash = "";
  url.searchParams.set("workspaceId", input.workspaceId); url.searchParams.set("projectId", input.projectId);
  url.searchParams.set("view", input.view);
  if (input.view === "portfolios" && sameWorkspace) {
    if (organizationCreate === "portfolio" || organizationCreate === "project") url.searchParams.set("organizationCreate", organizationCreate);
    if (sameScope && projectTab && /^[a-z-]{1,30}$/.test(projectTab)) url.searchParams.set("projectTab", projectTab);
    if (portfolioId && /^[A-Za-z0-9._:-]{1,128}$/.test(portfolioId)) url.searchParams.set("portfolioId", portfolioId);
    if (portfolioId && (portfolioTab === "about" || portfolioTab === "projects")) url.searchParams.set("portfolioTab", portfolioTab);
    if ((sameScope || catalogProjectId === input.projectId) && catalogProjectId
      && /^[A-Za-z0-9._:-]{1,128}$/.test(catalogProjectId)) url.searchParams.set("catalogProjectId", catalogProjectId);
  }
  if ((input.view === "cases" || (input.view === "portfolios" && embeddedCases)) && sameScope && folderId && /^[A-Za-z0-9._:-]{1,128}$/.test(folderId)) url.searchParams.set("folderId", folderId);
  if (input.view === "suites" && sameScope && suiteId && /^[A-Za-z0-9._:-]{1,128}$/.test(suiteId)) url.searchParams.set("suiteId", suiteId);
  if (input.view === "dashboard" && sameScope && detail && detail.length <= 6500) url.searchParams.set("dashboardDetail", detail);
  if (input.view === "profile" && section === "#security") url.hash = section;
  if (input.view === "help") {
    if (article && /^[a-z][a-z0-9-]{0,63}$/.test(article)) url.searchParams.set("article", article);
    if (/^#[a-z][a-z0-9-]{0,63}$/.test(section)) url.hash = section;
  }
  if (input.view === "runs" && input.runId) url.searchParams.set("runId", input.runId);
  if (input.view === "runs" && input.runId && input.runItemId) url.searchParams.set("runItemId", input.runItemId);
  if (input.view === "reports" && sameScope && defectId) url.searchParams.set("defectId", defectId);
  if (input.view === "hooks" && integration && (isProvider(integration) || integration === "youtrack")) {
    url.searchParams.set("integration", integration);
    if (sameScope && integration === "github" && (impact === "1" || analysisId)) {
      url.searchParams.set("impact", "1");
      if (analysisId && /^[A-Za-z0-9._:-]{1,128}$/.test(analysisId)) url.searchParams.set("analysisId", analysisId);
    }
  }
  return url.toString();
}

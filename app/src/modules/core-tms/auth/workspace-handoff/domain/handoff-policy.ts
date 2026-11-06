import type { WorkspaceHandoffNavigation, WorkspaceHandoffStart, WorkspaceTransitionTarget } from "./handoff-port";
const path = "/testcases/umbrella-home/work/";
const keys = ["projectId", "view", "settings", "integration", "plugin", "pluginSetup", "caseId", "folderId", "suiteId", "runId", "runItemId", "attemptId", "defectId", "environmentId", "portfolioId", "catalogProjectId"];
const identifier = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
export type WorkspaceHandoffRoute = "workspace" | "company_admin";
export function workspaceHandoffNavigation(target: WorkspaceTransitionTarget, workspaceId: string, href: string, locale: "en" | "ru", desktop: boolean, routeTarget: WorkspaceHandoffRoute = "workspace"): WorkspaceHandoffNavigation | null {
  const source = new URL(href), destination = new URL(target.destinationOrigin);
  const suffix = "-falcon.saturnusgo.com", slug = destination.hostname.endsWith(suffix) ? destination.hostname.slice(0, -suffix.length) : "";
  if (target.workspaceId !== workspaceId || !identifier(workspaceId) || !Number.isSafeInteger(target.generation) || target.generation < 1
    || target.destinationOrigin !== destination.origin || destination.protocol !== "https:" || destination.username || destination.password || destination.port
    || !(destination.hostname === "tms.saturnusgo.com" || (slug.length >= 2 && slug.length <= 48 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))) throw new Error("Invalid workspace target");
  if (source.origin === destination.origin) return null;
  const route = new URL(routeTarget === "company_admin" ? "/admin/" : path, source.origin);
  if (routeTarget === "company_admin") route.searchParams.set("account", "personal");
  route.searchParams.set("workspaceId", workspaceId);
  if (routeTarget === "company_admin") route.searchParams.set("page", "company");
  for (const key of routeTarget === "company_admin" ? ["projectId"] : keys) { const value = source.searchParams.get(key); if (identifier(value) && source.searchParams.getAll(key).length === 1) route.searchParams.set(key, value); }
  route.searchParams.set("lang", locale);
  const fields: WorkspaceHandoffStart = { workspaceId, destinationOrigin: destination.origin, route: route.pathname + route.search, locale };
  if (desktop) return { kind: "desktop", url: `${source.origin}/desktop-workspace-transition/?${new URLSearchParams(fields)}` };
  return { kind: "browser", action: `${source.origin}/api/v1/auth/workspace-handoffs`, fields };
}

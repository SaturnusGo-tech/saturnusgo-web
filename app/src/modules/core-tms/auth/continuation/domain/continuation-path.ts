import { canonicalWorkspacePathname, LEGACY_WORKSPACE_PATH, WORKSPACE_PATH } from "../../../navigation/workspace-route";
import { readPlanRequestIntent } from "../../../billing/requests/domain/plan-request";
const workspace = WORKSPACE_PATH;
const pages = new Set([workspace, LEGACY_WORKSPACE_PATH, "/admin/", "/profile/", "/work/notification-preferences/"]);
const identifiers = new Set(["workspaceId", "projectId", "catalogProjectId", "portfolioId", "folderId", "caseId", "runId", "runItemId", "suiteId", "stepId", "attachmentId", "falconMcpInteraction"]);
const routes = new Set(["view", "settings", "page", "tab", "article"]);
type PlanIntent = NonNullable<ReturnType<typeof readPlanRequestIntent>>;

export function setPlanRequestIntent(params: URLSearchParams, intent: PlanIntent): void {
  if (intent.kind === "offer") params.set("requestPlan", intent.planId);
  else {
    params.set("planRequest", intent.id);
    params.set("workspaceId", intent.workspaceId);
  }
}

export function scopedPlanContinuation(path: string | null, origin: string, workspaceId: string): PlanIntent | null {
  if (!path) return null;
  const url = new URL(path, origin);
  if (url.origin !== origin || canonicalWorkspacePathname(url.pathname) !== workspace
    || url.searchParams.getAll("view").length !== 1 || url.searchParams.get("view") !== "config"
    || url.searchParams.getAll("settings").length !== 1 || url.searchParams.get("settings") !== "billing") return null;
  const workspaceIds = url.searchParams.getAll("workspaceId");
  if (workspaceIds.length > 0 && (workspaceIds.length !== 1 || workspaceIds[0] !== workspaceId)) return null;
  return readPlanRequestIntent(url.search);
}

export function safeContinuationPath(candidate: unknown, origin: string): string | null {
  if (typeof candidate !== "string" || candidate.length > 4096 || !candidate.startsWith("/") || candidate.startsWith("//")
    || /[\\\x00-\x1f\x7f]/.test(candidate)) return null;
  try {
    const url = new URL(candidate, origin);
    if (url.origin !== origin || !pages.has(url.pathname)) return null;
    const query = new URLSearchParams();
    for (const key of new Set(url.searchParams.keys())) {
      const values = url.searchParams.getAll(key);
      if (values.length !== 1) continue;
      const value = values[0];
      if (identifiers.has(key) && /^[A-Za-z0-9_-]{1,128}$/.test(value)) query.set(key, value);
      else if (routes.has(key) && /^[A-Za-z][A-Za-z0-9_-]{0,64}$/.test(value)) query.set(key, value);
      else if (key === "lang" && (value === "ru" || value === "en")) query.set(key, value);
    }
    if (canonicalWorkspacePathname(url.pathname) === workspace && query.get("view") === "config" && query.get("settings") === "billing") {
      const plan = readPlanRequestIntent(url.search);
      if (plan) setPlanRequestIntent(query, plan);
    }
    const hash = /^#[A-Za-z0-9_-]{1,128}$/.test(url.hash) ? url.hash : "";
    return `${canonicalWorkspacePathname(url.pathname)}${query.size ? `?${query}` : ""}${hash}`;
  } catch { return null; }
}
export function continuationFromLocation(location: Pick<Location, "origin" | "pathname" | "search" | "hash">): string | null {
  const direct = safeContinuationPath(`${location.pathname}${location.search}${location.hash}`, location.origin);
  if (direct) return direct;
  if (!/^\/(?:login|cloud-login|signup)\/?$/.test(location.pathname)) return null;
  const query = new URLSearchParams(location.search);
  const plan = readPlanRequestIntent(location.search);
  if (plan) {
    const params = new URLSearchParams({ view: "config", settings: "billing" });
    setPlanRequestIntent(params, plan);
    const lang = query.get("lang");
    if (lang === "en" || lang === "ru") params.set("lang", lang);
    return `${workspace}?${params}`;
  }
  const values = query.getAll("falconMcpInteraction");
  if (values.length === 1 && /^[A-Za-z0-9_-]{1,128}$/.test(values[0]))
    return `${workspace}?falconMcpInteraction=${encodeURIComponent(values[0])}`;
  const guide = query.getAll("guide");
  return guide.length === 1 && guide[0] === "chat" ? `${workspace}?view=help&article=falcon-ai-chat` : null;
}
export function hasContinuationContext(path: string, origin: string): boolean {
  try {
    const target = new URL(path, origin);
    return canonicalWorkspacePathname(target.pathname) !== workspace || !!target.hash || [...target.searchParams.keys()].some(key => key !== "workspaceId");
  } catch { return false; }
}

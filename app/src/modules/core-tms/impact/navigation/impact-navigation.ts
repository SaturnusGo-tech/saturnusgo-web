import type { ImpactScope } from "../model/impact-types";
const validId = (value: string | null): value is string => Boolean(value && /^[A-Za-z0-9._:-]{1,128}$/.test(value));
const pluginManager = (query: URLSearchParams) => query.get("view") === "config"
  && query.get("settings") === "plugins" && query.get("plugin") === "github";
const legacyWorkspace = (query: URLSearchParams) => query.get("view") === "hooks" && query.get("integration") === "github";
export function readImpactSelection(href: string, scope: ImpactScope): string | null {
  const query = new URL(href).searchParams;
  if (query.get("workspaceId") !== scope.workspaceId || query.get("projectId") !== scope.projectId
    || !pluginManager(query) && !legacyWorkspace(query)) return null;
  const id = query.get("analysisId");
  return validId(id) ? id : null;
}
export function impactHref(href: string, scope: ImpactScope, analysisId: string | null): string {
  if (analysisId !== null && !validId(analysisId)) throw new Error("Invalid analysis identifier");
  const url = new URL(href); const manager = pluginManager(url.searchParams); url.search = ""; url.hash = "";
  for (const [key, value] of Object.entries(scope)) url.searchParams.set(key, value);
  if (manager) { url.searchParams.set("view", "config"); url.searchParams.set("settings", "plugins"); url.searchParams.set("plugin", "github"); }
  else { url.searchParams.set("view", "hooks"); url.searchParams.set("integration", "github"); }
  url.searchParams.set("impact", "1");
  if (analysisId) url.searchParams.set("analysisId", analysisId);
  return url.toString();
}
export function safeImpactLink(value: string | null | undefined): string | undefined {
  try { const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : undefined;
  } catch { return undefined; }
}

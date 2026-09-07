import type { ImpactScope } from "../model/impact-types";
const validId = (value: string | null): value is string => Boolean(value && /^[A-Za-z0-9._:-]{1,128}$/.test(value));
export function readImpactSelection(href: string, scope: ImpactScope): string | null {
  const query = new URL(href).searchParams;
  if (query.get("workspaceId") !== scope.workspaceId || query.get("projectId") !== scope.projectId
    || query.get("integration") !== "github" || query.get("view") !== "hooks") return null;
  const id = query.get("analysisId");
  return validId(id) ? id : null;
}
export function impactHref(href: string, scope: ImpactScope, analysisId: string | null): string {
  if (analysisId !== null && !validId(analysisId)) throw new Error("Invalid analysis identifier");
  const url = new URL(href); url.search = ""; url.hash = "";
  for (const [key, value] of Object.entries(scope)) url.searchParams.set(key, value);
  url.searchParams.set("view", "hooks"); url.searchParams.set("integration", "github");
  url.searchParams.set("impact", "1");
  if (analysisId) url.searchParams.set("analysisId", analysisId);
  return url.toString();
}
export function safeImpactLink(value: string | null | undefined): string | undefined {
  try { const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : undefined;
  } catch { return undefined; }
}

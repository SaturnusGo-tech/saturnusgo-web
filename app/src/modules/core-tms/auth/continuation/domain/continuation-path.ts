const workspace = "/testcases/umbrella-home/work/";
const pages = new Set([workspace, "/admin/", "/profile/"]);
const identifiers = new Set(["workspaceId", "projectId", "catalogProjectId", "portfolioId", "folderId", "caseId", "runId", "runItemId", "suiteId", "stepId", "attachmentId", "falconMcpInteraction"]);
const routes = new Set(["view", "settings", "page", "tab", "article"]);
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
    const hash = /^#[A-Za-z0-9_-]{1,128}$/.test(url.hash) ? url.hash : "";
    return `${url.pathname}${query.size ? `?${query}` : ""}${hash}`;
  } catch { return null; }
}
export function continuationFromLocation(location: Pick<Location, "origin" | "pathname" | "search" | "hash">): string | null {
  const direct = safeContinuationPath(`${location.pathname}${location.search}${location.hash}`, location.origin);
  if (direct) return direct;
  if (!/^\/(?:login|cloud-login|signup)\/?$/.test(location.pathname)) return null;
  const query = new URLSearchParams(location.search);
  const values = query.getAll("falconMcpInteraction");
  if (values.length === 1 && /^[A-Za-z0-9_-]{1,128}$/.test(values[0]))
    return `${workspace}?falconMcpInteraction=${encodeURIComponent(values[0])}`;
  const guide = query.getAll("guide");
  return guide.length === 1 && guide[0] === "chat" ? `${workspace}?view=help&article=falcon-ai-chat` : null;
}
export function hasContinuationContext(path: string, origin: string): boolean {
  try {
    const target = new URL(path, origin);
    return target.pathname !== workspace || !!target.hash || [...target.searchParams.keys()].some(key => key !== "workspaceId");
  } catch { return false; }
}

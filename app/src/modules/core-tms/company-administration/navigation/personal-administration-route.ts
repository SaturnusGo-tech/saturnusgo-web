const validScope = (value: string | null | undefined): value is string => Boolean(value && /^[A-Za-z0-9._:-]{1,128}$/.test(value));
export function personalAdministrationUrl(href: string, workspaceId: string, page?: "company" | "audit" | "codex"): string {
  const source = new URL(href);
  const query = new URLSearchParams({ account: "personal", workspaceId });
  const language = source.searchParams.get("lang");
  if (language === "ru" || language === "en") query.set("lang", language);
  const projectId = source.searchParams.get("projectId");
  if (validScope(projectId)) query.set("projectId", projectId);
  if (page) query.set("page", page);
  return `/admin/?${query}`;
}
export function hasPersonalAdministrationScope(href: string, workspaceId: string | null | undefined): boolean {
  const source = new URL(href);
  return source.pathname === "/admin/" && source.searchParams.get("account") === "personal"
    && validScope(workspaceId) && source.searchParams.get("workspaceId") === workspaceId;
}
export function personalAdministrationReturnUrl(href: string, workspaceId: string): string {
  const source = new URL(href);
  const query = new URLSearchParams({ workspaceId });
  const language = source.searchParams.get("lang");
  if (language === "ru" || language === "en") query.set("lang", language);
  const projectId = source.searchParams.get("projectId");
  if (validScope(projectId)) query.set("projectId", projectId);
  return `/work/?${query}`;
}

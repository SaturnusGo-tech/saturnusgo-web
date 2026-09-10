const workspacePath = "/testcases/umbrella-home/work/";

/** Only workspace/project context crosses into the personal profile. */
export function workspaceProfileUrl(href: string, section?: "security"): string {
  const source = new URL(href);
  const url = new URL(workspacePath, source.origin);
  for (const key of ["workspaceId", "projectId"]) {
    const value = source.searchParams.get(key);
    if (value && /^[A-Za-z0-9._:-]{1,128}$/.test(value)) url.searchParams.set(key, value);
  }
  url.searchParams.set("view", "profile");
  if (section === "security" || (source.pathname === "/profile/" && source.hash === "#security")) url.hash = "security";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function isWorkspaceProfileNavigation(href: string): boolean {
  return new URL(href).pathname === workspacePath;
}

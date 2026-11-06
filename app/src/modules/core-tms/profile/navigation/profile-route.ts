const workspacePath = "/work/";

/** Only workspace/project context crosses into the personal profile. */
export function workspaceProfileUrl(href: string, section?: "security"): string {
  const source = new URL(href);
  const url = new URL(workspacePath, source.origin);
  for (const key of ["workspaceId", "projectId"]) {
    const value = source.searchParams.get(key);
    if (value && /^[A-Za-z0-9._:-]{1,128}$/.test(value)) url.searchParams.set(key, value);
  }
  const security = section === "security" || (source.pathname === "/profile/" && ["#security", "#sessions"].includes(source.hash));
  url.searchParams.set("view", security ? "config" : "profile");
  if (security) {
    url.searchParams.set("settings", "security");
    if (source.pathname === "/profile/" && source.hash === "#sessions") url.hash = "sessions";
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function isWorkspaceProfileNavigation(href: string): boolean {
  return new URL(href).pathname === workspacePath;
}

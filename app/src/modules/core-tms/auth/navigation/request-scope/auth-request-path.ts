export function scopedAuthRequestPath(path: string, search = typeof window === "undefined" ? "" : window.location.search): string {
  const ids = new URLSearchParams(search).getAll("workspaceId");
  if (!path.startsWith("/api/v1/auth/") || ids.length !== 1 || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(ids[0])) return path;
  const url = new URL(path, "https://falcon.invalid");
  url.searchParams.set("workspaceId", ids[0]);
  return `${url.pathname}${url.search}`;
}

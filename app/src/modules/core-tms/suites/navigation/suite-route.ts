const suiteIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;
export function readSuiteRoute(href: string, workspaceId: string, projectId: string) {
  const query = new URL(href).searchParams;
  if (query.get("view") !== "suites" || query.get("workspaceId") !== workspaceId || query.get("projectId") !== projectId) return null;
  const id = query.get("suiteId");
  return id && suiteIdPattern.test(id) ? id : null;
}
export function buildSuiteRoute(href: string, workspaceId: string, projectId: string, id: string | null) {
  const url = new URL(href);
  url.searchParams.set("workspaceId", workspaceId);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("view", "suites");
  url.searchParams.delete("suiteId");
  url.searchParams.delete("suiteEdit");
  if (id && suiteIdPattern.test(id)) url.searchParams.set("suiteId", id);
  return url.toString();
}

export function readSuiteEditorRoute(href: string, workspaceId: string, projectId: string) {
  const query = new URL(href).searchParams;
  if (query.get("view") !== "suites" || query.get("workspaceId") !== workspaceId || query.get("projectId") !== projectId) return null;
  if (query.get("suiteEdit") === "new") return "new";
  return query.get("suiteEdit") === "edit" && readSuiteRoute(href, workspaceId, projectId) ? "edit" : null;
}

export function buildSuiteEditorRoute(href: string, workspaceId: string, projectId: string, id: string | null) {
  const url = new URL(buildSuiteRoute(href, workspaceId, projectId, id));
  url.searchParams.set("suiteEdit", id ? "edit" : "new");
  return url.toString();
}

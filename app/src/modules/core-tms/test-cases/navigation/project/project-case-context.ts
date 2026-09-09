/** The project plan embeds the canonical case workspace without leaving its project page. */
export function isProjectCaseContext(href: string, projectId?: string) {
  const query = new URL(href).searchParams;
  const selected = query.get("catalogProjectId");
  return query.get("view") === "portfolios" && !query.has("organizationCreate")
    && Boolean(selected && /^[A-Za-z0-9._:-]{1,128}$/.test(selected))
    && selected === (projectId ?? query.get("projectId"));
}

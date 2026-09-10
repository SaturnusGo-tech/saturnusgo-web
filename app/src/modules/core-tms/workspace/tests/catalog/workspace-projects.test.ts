import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { loadWorkspace } from "../../data/workspace-api";
import { loadAllWorkspaceProjects } from "../../../projects/catalog/application/list-projects";
const project = (id: string) => ({ id, workspaceId: "umbrella", key: id, name: id, status: "active", checklist: [] });

test("a fresh project deep link loads the entire paginated workspace catalog, including portfolio projects", async () => {
  const calls: URL[] = [];
  const http = createTmsHttpClient({ apiBase: "https://example.test/api/v1", accessToken: async () => "test-token",
    fetch: (async input => {
      const url = new URL(String(input)); calls.push(url);
      if (url.pathname.endsWith("/bootstrap")) return Response.json({ data: { workspace: { id: "umbrella", key: "U", name: "Umbrella" },
        projects: [project("integrations")], recentActivity: [], meta: { generatedAt: "today" } },
        meta: { compositionVersion: "workspace-bootstrap.v2", authorization: { role: "admin", capabilities: [] } } });
      if (url.pathname.endsWith("/projects")) return Response.json(url.searchParams.has("cursor")
        ? { data: [{ ...project("mobile"), portfolioId: "apps" }], meta: { hasMore: false, nextCursor: null } }
        : { data: [project("integrations"), project("host")], meta: { hasMore: true, nextCursor: "page-2" } });
      return Response.json({ data: [], meta: { hasMore: false, nextCursor: null } });
    }) as typeof fetch });
  const result = await loadWorkspace(http, "host", undefined, "umbrella");
  assert.deepEqual(result.projects.map(p => p.id), ["integrations", "host", "mobile"]);
  assert.equal(result.projects[2].portfolioId, "apps");
  const catalog = calls.filter(url => url.pathname.endsWith("/projects"));
  assert.equal(catalog.length, 2);
  for (const url of catalog) {
    assert.equal(url.searchParams.get("workspaceId"), "umbrella");
    assert.equal(url.searchParams.get("status"), "active");
    assert.equal(url.searchParams.has("portfolioId"), false);
    assert.equal(url.searchParams.has("unassigned"), false);
  }
  for (const url of calls.filter(url => !url.pathname.endsWith("/bootstrap") && !url.pathname.endsWith("/projects"))) {
    assert.equal(url.searchParams.get("projectId"), "host");
  }
});

test("catalog never silently accepts a truncated, looping, or foreign-workspace page", async () => {
  for (const mode of ["missing", "loop", "foreign", "failure"]) {
    let calls = 0;
    const http = createTmsHttpClient({ apiBase: "https://example.test/api/v1", accessToken: async () => "test-token",
      fetch: (async () => {
        calls++;
        if (mode === "failure") return Response.json({ error: { code: "FORBIDDEN", message: "denied" } }, { status: 403 });
        return Response.json({ data: [{ ...project("host"), workspaceId: mode === "foreign" ? "darwin" : "umbrella" }],
          meta: { hasMore: mode !== "foreign", nextCursor: mode === "loop" ? "same" : null } });
      }) as typeof fetch });
    await assert.rejects(loadAllWorkspaceProjects(http, "umbrella"));
    assert.ok(calls <= 2);
  }
});

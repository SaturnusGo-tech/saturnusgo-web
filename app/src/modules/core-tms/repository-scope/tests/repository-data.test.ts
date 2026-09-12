import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { loadPortfolioProjects, loadRepositoryPortfolios } from "../data/repository-catalog";
import { loadPortfolioRepository, loadRepositoryProject } from "../data/repository-content";

const signal = () => new AbortController().signal;
const portfolio = { id: "portfolio", workspaceId: "workspace", status: "active", name: "Portfolio", description: "", checklist: [] };
const project = (id: string) => ({ id, workspaceId: "workspace", portfolioId: "portfolio", name: id, status: "active" });
const page = (data: unknown[], nextCursor: string | null = null) => ({ data, meta: { hasMore: Boolean(nextCursor), nextCursor, limit: 100 } });
function http(get: (path: string, abort?: AbortSignal) => Promise<unknown>, resource = portfolio) {
  return { get, getResource: async () => ({ data: resource, etag: '"1"' }) } as unknown as TmsHttpClient;
}
test("portfolio/project catalogs follow every page and scope queries to workspace and portfolio", async () => {
  const requests: string[] = [];
  const api = http(async path => {
    requests.push(path); const query = new URL(path, "https://test").searchParams;
    assert.equal(query.get("workspaceId"), "workspace"); assert.equal(query.get("status"), "active");
    if (path.startsWith("/portfolios")) return page([{ ...portfolio, id: query.has("cursor") ? "p2" : "p1" }], query.has("cursor") ? null : "next");
    assert.equal(query.get("portfolioId"), "portfolio");
    return page([project(query.has("cursor") ? "project2" : "project1")], query.has("cursor") ? null : "next");
  });
  assert.equal((await loadRepositoryPortfolios(api, "workspace", signal())).length, 2);
  assert.deepEqual((await loadPortfolioProjects(api, "workspace", "portfolio", signal())).projects.map(item => item.id), ["project1", "project2"]);
  assert.equal(requests.length, 4);
});
test("archived, foreign-workspace and incorrect portfolio membership never produce a repository", async () => {
  for (const resource of [{ ...portfolio, status: "archived" }, { ...portfolio, workspaceId: "other" }]) {
    await assert.rejects(loadPortfolioProjects(http(async () => page([]), resource), "workspace", "portfolio", signal()));
  }
  await assert.rejects(loadPortfolioProjects(http(async () => page([{ ...project("a"), portfolioId: "other" }])), "workspace", "portfolio", signal()));
  await assert.rejects(loadRepositoryPortfolios(http(async () => page([{ ...portfolio, workspaceId: "other" }])), "workspace", signal()));
});
test("repeating cursors fail instead of looping or silently truncating either catalog", async () => {
  await assert.rejects(loadRepositoryPortfolios(http(async () => page([portfolio], "again")), "workspace", signal()), /did not advance/);
  await assert.rejects(loadPortfolioProjects(http(async () => page([project("a")], "again")), "workspace", "portfolio", signal()), /did not advance/);
});
test("project cases and folders preserve separate IDs even with identical folder paths", async () => {
  const api = http(async path => {
    const url = new URL(path, "https://test");
    if (path.startsWith("/test-cases")) {
      const id = url.searchParams.get("projectId")!;
      return page([{ id: `${id}-case`, projectId: id, tags: [], folderId: `${id}-folder`, folderPath: "/Auth" }]);
    }
    const id = path.split("/")[4];
    return page([{ id: `${id}-folder`, workspaceId: "workspace", projectId: id, path: "/Auth" }]);
  });
  const first = await loadRepositoryProject(api, "workspace", "first", signal());
  const second = await loadRepositoryProject(api, "workspace", "second", signal());
  assert.equal(first.cases[0].folderPath, second.cases[0].folderPath);
  assert.notEqual(first.cases[0].folderId, second.cases[0].folderId);
  await assert.rejects(loadRepositoryProject(http(async path => path.startsWith("/test-cases")
    ? page([{ id: "bad", projectId: "other", tags: [] }]) : page([])), "workspace", "first", signal()), /scope mismatch/);
});
test("portfolio loading uses bounded workers, reports project errors and includes projects beyond first page", async () => {
  let active = 0; let maximum = 0; const loaded = new Map<string, boolean>();
  const api = http(async path => {
    if (path.startsWith("/projects?")) return page(Array.from({ length: 8 }, (_, i) => project(`p${i}`)));
    if (!path.startsWith("/test-cases")) return page([]);
    active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 5)); active--;
    if (path.includes("projectId=p3&")) throw new Error("Unavailable project");
    return page([]);
  });
  await loadPortfolioRepository(api, "workspace", "portfolio", signal(), () => {}, (id, content) => loaded.set(id, content !== null));
  assert.equal(maximum, 3); assert.equal(loaded.size, 8); assert.equal(loaded.get("p3"), false);
  assert.equal([...loaded.values()].filter(Boolean).length, 7);
});
test("cancellation stops publishing project results and scheduling more projects", async () => {
  const controller = new AbortController(); let requests = 0; let published = 0;
  const api = http(async path => {
    if (path.startsWith("/projects?")) return page(Array.from({ length: 8 }, (_, i) => project(`p${i}`)));
    if (path.startsWith("/test-cases")) { requests++; controller.abort(); }
    return page([]);
  });
  await assert.rejects(loadPortfolioRepository(api, "workspace", "portfolio", controller.signal, () => {}, () => published++));
  assert.equal(published, 0); assert.ok(requests <= 3);
});

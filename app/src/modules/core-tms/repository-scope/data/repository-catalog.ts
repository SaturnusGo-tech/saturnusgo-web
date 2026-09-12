import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { listPortfolios, getPortfolio } from "../../portfolios/data/portfolio-api";
import { listProjectCatalog } from "../../projects/catalog/data/project-catalog-api";

export async function loadRepositoryPortfolios(http: TmsHttpClient, workspaceId: string, signal: AbortSignal) {
  const items = new Map<string, Awaited<ReturnType<typeof listPortfolios>>["items"][number]>();
  const seen = new Set<string>(); let cursor: string | null = null;
  do {
    signal.throwIfAborted();
    const page = await listPortfolios(http, workspaceId, "active", cursor, signal);
    for (const item of page.items) {
      if (item.workspaceId !== workspaceId) throw new Error("Portfolio scope mismatch.");
      items.set(item.id, item);
    }
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error("Portfolio pagination did not advance.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return [...items.values()];
}

export async function loadPortfolioProjects(http: TmsHttpClient, workspaceId: string, portfolioId: string, signal: AbortSignal) {
  const { data: portfolio } = await getPortfolio(http, portfolioId, signal);
  if (portfolio.workspaceId !== workspaceId || portfolio.status !== "active") throw new Error("Portfolio is unavailable.");
  const items = new Map<string, Awaited<ReturnType<typeof listProjectCatalog>>["items"][number]>();
  const seen = new Set<string>(); let cursor: string | null = null;
  do {
    signal.throwIfAborted();
    const page = await listProjectCatalog(http, { workspaceId, portfolioId, status: "active" }, cursor, signal);
    for (const item of page.items) {
      if (item.portfolioId !== portfolioId || item.status === "archived") throw new Error("Project portfolio mismatch.");
      items.set(item.id, item);
    }
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error("Project pagination did not advance.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return { portfolio, projects: [...items.values()] };
}

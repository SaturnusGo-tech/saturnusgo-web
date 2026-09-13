import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { transitionPortfolio } from "../../data/portfolio-api";
import { getProject, transitionProjectResource, updateProjectResource } from "../../../projects/data/project-api";
import type { CatalogAction } from "../model/action";

export async function executeCatalogAction(http: TmsHttpClient, target: CatalogAction, key: string, signal: AbortSignal) {
  if (target.kind === "portfolio") {
    const etag = `"portfolio:${target.item.id}:${target.item.rowVersion}"`;
    const result = await transitionPortfolio(http, target.item.id, target.action, etag, key, signal);
    return { kind: "portfolio" as const, ...result };
  }
  const version = target.item.rowVersion;
  const etag = version ? `"project:${target.item.id}:${version}"` : (await getProject(http, target.item.id, signal)).etag;
  if (!etag) throw new Error("Project ETag is required.");
  const result = target.action === "detach"
    ? await updateProjectResource(http, target.item.id, { portfolioId: null }, etag, key, signal)
    : await transitionProjectResource(http, target.item.id, target.action, etag, key, signal);
  return { kind: "project" as const, ...result };
}

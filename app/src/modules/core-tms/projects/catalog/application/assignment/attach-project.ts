import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { getProject, updateProjectResource } from "../../../data/project-api";

export async function attachProject(http: TmsHttpClient, projectId: string, portfolioId: string, operationKey: string, signal?: AbortSignal) {
  const current = await getProject(http, projectId, signal);
  signal?.throwIfAborted();
  if (current.data.portfolioId === portfolioId) return current;
  if (current.data.portfolioId) throw new Error("The project was assigned to another portfolio. Refresh the list.");
  if (!current.etag) throw new Error("Project ETag is required.");
  return updateProjectResource(http, projectId, { portfolioId }, current.etag, operationKey, signal);
}

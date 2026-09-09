import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { getProject } from "../../data/project-api";

export async function loadCatalogProject(http: TmsHttpClient, id: string, signal?: AbortSignal) {
  return getProject(http, id, signal);
}

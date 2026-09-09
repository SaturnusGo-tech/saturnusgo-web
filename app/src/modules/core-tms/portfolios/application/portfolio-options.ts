import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { listPortfolios } from "../data/portfolio-api";

export async function loadPortfolioOptions(http: TmsHttpClient, workspaceId: string, cursor: string | null, signal?: AbortSignal) {
  return listPortfolios(http, workspaceId, "active", cursor, signal);
}

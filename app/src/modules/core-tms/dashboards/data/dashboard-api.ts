import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { mapDashboard } from "./dashboard-mapper";

type Api = components["schemas"];

export async function createDashboardResource(
  http: TmsHttpClient,
  body: Api["DashboardCreateRequest"],
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Dashboard"]>(
    "/dashboards",
    "POST",
    body,
    { idempotencyKey },
  );
  return { data: mapDashboard(resource.data), etag: resource.etag };
}

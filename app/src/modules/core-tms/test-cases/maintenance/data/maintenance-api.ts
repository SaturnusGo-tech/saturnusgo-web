import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { CaseMaintenance, MaintenanceChange } from "../model/case-maintenance";
const path = (caseId: string) => `/test-cases/${encodeURIComponent(caseId)}/maintenance`;
export async function getCaseMaintenance(http: TmsHttpClient, caseId: string, signal?: AbortSignal) {
  const resource = await http.getResource<CaseMaintenance>(path(caseId), signal);
  return { data: resource.data, etag: resource.etag ?? resource.data.etag };
}
export async function changeCaseMaintenance(http: TmsHttpClient, caseId: string, change: MaintenanceChange,
  etag: string, idempotencyKey: string, signal?: AbortSignal) {
  const resource = await http.mutateResource<CaseMaintenance>(path(caseId), "POST", change, { ifMatch: etag, idempotencyKey, signal });
  return { data: resource.data, etag: resource.etag ?? resource.data.etag };
}

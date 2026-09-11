import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
export type RunOrganizationRequest=components["schemas"]["RunItemOrganizationRequest"];
export type RunOrganizationAction=RunOrganizationRequest["action"];
export async function organizeRunItems(http:TmsHttpClient,workspaceId:string,body:RunOrganizationRequest,key:string) {
  return http.mutateResource<{updated:number}>(`/workspaces/${encodeURIComponent(workspaceId)}/run-item-organization`,"POST",body,{idempotencyKey:key});
}

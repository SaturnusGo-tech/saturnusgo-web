import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { WorkspaceHandoffPort, WorkspaceTransitionTarget } from "../domain/handoff-port";
export function createWorkspaceHandoffApi(http:TmsHttpClient):WorkspaceHandoffPort {
  return {target:async(workspaceId,signal)=>(await http.getResource<WorkspaceTransitionTarget>(`/auth/workspace-target?${new URLSearchParams({workspaceId})}`,signal)).data};
}

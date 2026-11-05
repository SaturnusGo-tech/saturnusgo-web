import { TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WorkspaceCapabilities, WorkspaceCapabilitiesReader } from "../domain/workspace-capabilities";
export function createWorkspaceCapabilityReader(http: TmsHttpClient): WorkspaceCapabilitiesReader {
  return async (workspaceId, signal) => {
    const result = (await http.getResource<WorkspaceCapabilities>(`/codex/setup?${new URLSearchParams({ workspaceId })}`, signal)).data;
    if (result.workspaceId !== workspaceId) throw new TmsApiError("Workspace capability scope mismatch", 403, null, "FORBIDDEN");
    return result;
  };
}

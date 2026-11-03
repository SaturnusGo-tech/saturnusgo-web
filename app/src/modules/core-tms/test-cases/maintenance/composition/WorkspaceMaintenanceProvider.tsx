import { useCallback, useRef, type ReactNode } from "react";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { MaintenanceContext } from "../context/MaintenanceContext";
import { mergeMaintenance, type CaseMaintenance } from "../model/case-maintenance";
export function WorkspaceMaintenanceProvider({ model, children }: { model: WorkspaceModel; children: ReactNode }) {
  const workspaceId = model.data.workspace.id;
  const currentWorkspace = useRef(workspaceId); currentWorkspace.current = workspaceId;
  const confirmed = useCallback((caseId: string, projection: CaseMaintenance) => {
    if (currentWorkspace.current !== workspaceId) return;
    model.setData(current => {
      if (current.workspace.id !== workspaceId) return current;
      const testCases = current.testCases.map(item => mergeMaintenance(item, caseId, projection));
      return testCases.every((item, index) => item === current.testCases[index]) ? current : { ...current, testCases };
    });
    model.setSelectedCaseDetail(current => current && currentWorkspace.current === workspaceId ? mergeMaintenance(current, caseId, projection) : current);
  }, [workspaceId, model.setData, model.setSelectedCaseDetail]);
  return <MaintenanceContext.Provider value={{ workspaceId, connected: model.connection === "connected",
    canManage: model.data.meta.authorization.capabilities.includes("test_case:manage"), confirmed }}>{children}</MaintenanceContext.Provider>;
}

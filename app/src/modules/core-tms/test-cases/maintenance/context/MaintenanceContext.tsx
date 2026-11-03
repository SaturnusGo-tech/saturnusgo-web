import { createContext, useContext } from "react";
import type { CaseMaintenance } from "../model/case-maintenance";
export const MaintenanceContext = createContext({ workspaceId: "", connected: false, canManage: false,
  confirmed: (_caseId: string, _projection: CaseMaintenance) => {} });
export const useMaintenanceWorkspace = () => useContext(MaintenanceContext);

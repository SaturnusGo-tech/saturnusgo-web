"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { companyViewAvailable } from "../../../auth/managed/domain/features/company-features";
import { useConnectorCatalog } from "../catalog/useConnectorCatalog";
type Catalog = ReturnType<typeof useConnectorCatalog>;
const Context = createContext<Catalog>({ workspaceId: "", connections: [], state: "loading",
  refresh: () => {}, update: () => {} });
export function WorkspaceConnectorProvider({ workspaceId, active, children }: {
  workspaceId: string; projectId: string; active: boolean; children: ReactNode;
}) {
  const session = useOptionalTmsSession();
  const integrations = companyViewAvailable("hooks", session?.companyCapabilities);
  const catalog = useConnectorCatalog(workspaceId, active && integrations);
  return <Context.Provider value={catalog}>{children}</Context.Provider>;
}
export function useWorkspaceConnectors() { return useContext(Context); }

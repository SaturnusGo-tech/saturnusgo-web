"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { companyViewAvailable } from "../../../auth/managed/domain/features/company-features";
import { hasConnectedSwagger } from "../../model/swagger/swagger-availability";
import { useConnectorCatalog } from "../catalog/useConnectorCatalog";
type Catalog = ReturnType<typeof useConnectorCatalog> & { swaggerConnected: boolean };
const Context = createContext<Catalog>({ workspaceId: "", connections: [], state: "loading",
  swaggerConnected: false, refresh: () => {}, update: () => {} });
export function WorkspaceConnectorProvider({ workspaceId, projectId, active, children }: {
  workspaceId: string; projectId: string; active: boolean; children: ReactNode;
}) {
  const session = useOptionalTmsSession();
  const enabled = active && (companyViewAvailable("hooks", session?.companyCapabilities) ||
    companyViewAvailable("api", session?.companyCapabilities));
  const catalog = useConnectorCatalog(workspaceId, enabled);
  const swaggerConnected = catalog.state === "ready" && hasConnectedSwagger(catalog.connections, { workspaceId, projectId });
  return <Context.Provider value={{ ...catalog, swaggerConnected }}>{children}</Context.Provider>;
}
export function useWorkspaceConnectors() { return useContext(Context); }

import { useMemo, type ReactNode } from "react";
import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { TestDataProvider, type TestDataContextValue } from "../application/context/TestDataContext";
import { TdmAvailabilityProvider } from "../application/availability/TdmAvailability";
import { useTdmConfiguration } from "../application/configuration/useTdmConfiguration";
import { createConfigurationClient } from "../data/configuration/configuration-client";
import { createTestDataClient } from "../data/composition/test-data-client";
import type { DataEnvironment } from "../model/resources/resource";
export function TdmWorkspaceProvider({ workspaceId, projectId, actorId, active, environments, children }: {
  workspaceId: string; projectId: string; actorId: string; active: boolean; environments: readonly DataEnvironment[]; children: ReactNode;
}) {
  const http = useOptionalTmsHttpClient();
  const base = `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/test-data`;
  const loader = useMemo(() => active && http && projectId ? createConfigurationClient(http, base) : null, [active, http, base, projectId, actorId]);
  const config = useTdmConfiguration(loader);
  const port = useMemo(() => http ? createTestDataClient(http, base, workspaceId, projectId) : null, [http, base, workspaceId, projectId]);
  const feature = useMemo<TestDataContextValue | null>(() => {
    const value = config.value; if (!value?.enabled || !port) return null;
    const allowed = (permission: string) => value.permissions.includes(permission);
    return { port, projectId, actorId, environments, configuration: value, permissions: {
      read: allowed("test_data:read"), bind: allowed("test_data:bind"), create: allowed("test_data:create"), update: allowed("test_data:update"),
      archive: allowed("test_data:archive"), credentialCreate: value.credentialsAvailable && allowed("credential:create"),
      credentialUpdate: allowed("credential:update"), rotate: value.credentialsAvailable && allowed("credential:rotate"), disable: allowed("credential:disable"),
      reveal: value.credentialsAvailable && value.revealVerificationAvailable && allowed("credential:reveal"), use: allowed("credential:use"),
    } };
  }, [config.value, port, projectId, actorId, environments]);
  const availability = useMemo(() => ({ enabled: Boolean(feature), pending: config.pending, error: config.error, retry: config.retry }), [feature, config.pending, config.error, config.retry]);
  return <TdmAvailabilityProvider value={availability}><TestDataProvider value={feature}>{children}</TestDataProvider></TdmAvailabilityProvider>;
}

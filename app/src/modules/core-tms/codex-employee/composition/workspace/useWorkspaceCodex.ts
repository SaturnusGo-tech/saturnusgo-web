import { useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useWorkspaceCapabilities } from "../../../auth/spaces/capabilities/composition/useWorkspaceCapabilities";
import { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { createCodexEmployeeApi } from "../../data/http/codex-employee-api";
export function useWorkspaceCodex(enabled: boolean, workspaceId?: string) {
  const http = useTmsHttpClient();
  const metadata = useWorkspaceCapabilities(workspaceId, enabled);
  const api = useMemo(() => createCodexEmployeeApi(http), [http, workspaceId]);
  const company = metadata.value?.connectionKind === "company";
  const employee = useCodexEmployee(api, enabled && company, { connections: false });
  const value = metadata.value;
  const connection = value ? { version: value.server.version, authentication: value.server.authentication, mcpUrl: value.server.url,
    resource: value.server.resource, oauthIssuer: value.server.issuer, scopes: [...value.server.scopes] } : undefined;
  return { ...employee, employee: company ? employee.employee : null, connection, readOnly: value?.readOnly, canConnect: value?.canConnect ?? false, connectionKind: value?.connectionKind,
    available: !!value && value.status !== "unavailable", loading: metadata.loading || (company && employee.loading), error: metadata.error ?? employee.error,
    refresh: () => { metadata.reload(); employee.refresh(); } };
}

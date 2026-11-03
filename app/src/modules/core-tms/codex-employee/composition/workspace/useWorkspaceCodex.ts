import { useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { createCodexEmployeeApi } from "../../data/http/codex-employee-api";

export function useWorkspaceCodex(enabled: boolean) {
  const http = useTmsHttpClient();
  const api = useMemo(() => createCodexEmployeeApi(http), [http]);
  return useCodexEmployee(api, enabled, { connections: false });
}

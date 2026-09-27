import { useCallback, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { listCustomFields } from "../../data/custom-field-api";
import type { CustomFieldStatus } from "../../model/custom-field";
import { useFieldPage } from "../list/useFieldPage";
export function useCustomFieldCatalog(workspaceId: string, projectId: string, enabled = true) {
  const http = useTmsHttpClient(); const [status, setStatus] = useState<CustomFieldStatus>("active");
  const load = useCallback((search: string, cursor: string | null, signal: AbortSignal) =>
    listCustomFields(http, { workspaceId, projectId }, { search, cursor, status }, signal), [http, workspaceId, projectId, status]);
  return { ...useFieldPage(load, enabled && Boolean(workspaceId && projectId)), status, setStatus };
}

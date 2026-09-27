import { useCallback, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { listCustomFieldValues } from "../../data/custom-field-api";
import type { CustomFieldScope, CustomFieldStatus } from "../../model/custom-field";
import { useFieldPage } from "../list/useFieldPage";
export function useCustomFieldValues({ workspaceId, projectId, fieldId, parentValueId, enabled = true }:
  CustomFieldScope & { fieldId: string; parentValueId?: string | null; enabled?: boolean }) {
  const http = useTmsHttpClient(); const [status, setStatus] = useState<CustomFieldStatus>("active");
  const load = useCallback((search: string, cursor: string | null, signal: AbortSignal) =>
    listCustomFieldValues(http, { workspaceId, projectId }, fieldId, { search, cursor, status, parentValueId }, signal),
  [http, workspaceId, projectId, fieldId, parentValueId, status]);
  return { ...useFieldPage(load, enabled && Boolean(workspaceId && projectId && fieldId)), status, setStatus };
}

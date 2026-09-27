import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getCustomField } from "../../data/custom-field-api";
import type { CustomFieldScope, CustomFieldDefinition } from "../../model/custom-field";
export function useParentField({ workspaceId, projectId }: CustomFieldScope, fieldId: string | null) {
  const http = useTmsHttpClient(); const [state, setState] = useState({ field: null as CustomFieldDefinition | null, loading: false, failure: null as unknown });
  useEffect(() => {
    const controller = new AbortController(); setState({ field: null, loading: Boolean(fieldId), failure: null });
    if (fieldId) void getCustomField(http, { workspaceId, projectId }, fieldId, controller.signal)
      .then(result => { if (!controller.signal.aborted) setState({ field: result.data, loading: false, failure: null }); })
      .catch(failure => { if (!controller.signal.aborted) setState({ field: null, loading: false, failure }); });
    return () => controller.abort();
  }, [workspaceId, projectId, fieldId, http]);
  return state;
}

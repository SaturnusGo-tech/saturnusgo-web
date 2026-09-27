import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getCustomFieldValue } from "../../data/custom-field-value-read";
import type { CustomFieldScope, CustomFieldValue } from "../../model/custom-field";
export function useParentValue({ workspaceId, projectId }: CustomFieldScope, fieldId: string | null, valueId: string | null) {
  const http = useTmsHttpClient(); const [state, setState] = useState({ value: null as CustomFieldValue | null, loading: Boolean(valueId), failure: null as unknown });
  useEffect(() => {
    const controller = new AbortController(); setState({ value: null, loading: Boolean(fieldId && valueId), failure: null });
    if (fieldId && valueId) void getCustomFieldValue(http, { workspaceId, projectId }, fieldId, valueId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setState({ value, loading: false, failure: null }); })
      .catch(failure => { if (!controller.signal.aborted) setState({ value: null, loading: false, failure }); });
    return () => controller.abort();
  }, [workspaceId, projectId, fieldId, valueId, http]);
  return state;
}

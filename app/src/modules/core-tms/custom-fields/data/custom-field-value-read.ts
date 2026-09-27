import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { CustomFieldScope, CustomFieldValue } from "../model/custom-field";
export async function getCustomFieldValue(http: TmsHttpClient, scope: CustomFieldScope, fieldId: string, valueId: string, signal?: AbortSignal) {
  return (await http.getResource<CustomFieldValue>(`/projects/${encodeURIComponent(scope.projectId)}/custom-fields/${encodeURIComponent(fieldId)}/values/${encodeURIComponent(valueId)}?workspaceId=${encodeURIComponent(scope.workspaceId)}`, signal)).data;
}

import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { fieldEtag, valueEtag, type CustomFieldScope, type CustomFieldDefinition, type CustomFieldDraft,
  type CustomFieldValue, type CustomFieldValueDraft, type CustomFieldPage, type CustomFieldStatus } from "../model/custom-field";
type Query = { search?: string; cursor?: string | null; status?: CustomFieldStatus; parentValueId?: string | null; limit?: string };
function path(scope: CustomFieldScope, suffix = "", query: Query = {}) {
  const params = new URLSearchParams({ workspaceId: scope.workspaceId });
  for (const [key, value] of Object.entries(query)) if (value != null && value !== "") params.set(key, value);
  return `/projects/${encodeURIComponent(scope.projectId)}/custom-fields${suffix}?${params}`;
}
async function list<T>(http: TmsHttpClient, route: string, signal?: AbortSignal): Promise<CustomFieldPage<T>> {
  const envelope = await http.get<{ data: T[]; meta: { nextCursor?: string | null } }>(route, signal);
  return { items: envelope.data, nextCursor: envelope.meta.nextCursor ?? null };
}
export const listCustomFields = (http: TmsHttpClient, scope: CustomFieldScope, query: Query, signal?: AbortSignal) =>
  list<CustomFieldDefinition>(http, path(scope, "", { ...query, limit: "50" }), signal);
export const listCustomFieldValues = (http: TmsHttpClient, scope: CustomFieldScope, fieldId: string, query: Query, signal?: AbortSignal) =>
  list<CustomFieldValue>(http, path(scope, `/${encodeURIComponent(fieldId)}/values`, { ...query, limit: "50" }), signal);
export const getCustomField = (http: TmsHttpClient, scope: CustomFieldScope, id: string, signal?: AbortSignal) =>
  http.getResource<CustomFieldDefinition>(path(scope, `/${encodeURIComponent(id)}`), signal);
export async function saveCustomField(http: TmsHttpClient, scope: CustomFieldScope, draft: CustomFieldDraft,
  current: CustomFieldDefinition | null, operationKey: string, signal?: AbortSignal) {
  const result = await http.mutateResource<CustomFieldDefinition>(path(scope, current ? `/${encodeURIComponent(current.id)}` : ""),
    current ? "PATCH" : "POST", draft, { idempotencyKey: operationKey, ifMatch: current ? fieldEtag(current) : undefined, signal });
  return result.data;
}
export async function transitionCustomField(http: TmsHttpClient, scope: CustomFieldScope, field: CustomFieldDefinition,
  action: "archive" | "restore", operationKey: string, signal?: AbortSignal) {
  return (await http.mutateResource<CustomFieldDefinition>(path(scope, `/${encodeURIComponent(field.id)}/${action}`), "POST", undefined,
    { ifMatch: fieldEtag(field), idempotencyKey: operationKey, signal })).data;
}
export async function saveCustomFieldValue(http: TmsHttpClient, scope: CustomFieldScope, fieldId: string, draft: CustomFieldValueDraft,
  current: CustomFieldValue | null, operationKey: string, signal?: AbortSignal) {
  const suffix = `/${encodeURIComponent(fieldId)}/values${current ? `/${encodeURIComponent(current.id)}` : ""}`;
  return (await http.mutateResource<CustomFieldValue>(path(scope, suffix), current ? "PATCH" : "POST", draft,
    { idempotencyKey: operationKey, ifMatch: current ? valueEtag(current) : undefined, signal })).data;
}
export async function transitionCustomFieldValue(http: TmsHttpClient, scope: CustomFieldScope, value: CustomFieldValue,
  action: "archive" | "restore", operationKey: string, signal?: AbortSignal) {
  return (await http.mutateResource<CustomFieldValue>(path(scope, `/${encodeURIComponent(value.fieldId)}/values/${encodeURIComponent(value.id)}/${action}`),
    "POST", undefined, { ifMatch: valueEtag(value), idempotencyKey: operationKey, signal })).data;
}

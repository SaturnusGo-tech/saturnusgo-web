import type { components } from "../../../../../core/tms/generated/tms-api";

export type ProductDocProperties = components["schemas"]["ProductDocProperties"];
export type ProductDocPropertiesInput = components["schemas"]["ProductDocPropertiesInput"];
export type ProductDocPriority = components["schemas"]["ProductDocPriority"];

export const emptyProductDocProperties: ProductDocProperties = { priority: null, assignee: null, labels: [] };

export function productDocPropertiesInput(value = emptyProductDocProperties): ProductDocPropertiesInput {
  return { priority: value.priority, assigneeIdentityId: value.assignee?.identityId ?? null, labels: value.labels };
}

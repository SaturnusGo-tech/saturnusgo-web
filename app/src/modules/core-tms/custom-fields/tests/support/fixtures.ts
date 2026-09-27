import type { CustomFieldDefinition, CustomFieldValue } from "../../model/custom-field";
export const field: CustomFieldDefinition = { id: "field-a", workspaceId: "workspace-a", projectId: "project-a",
  name: "Provider", identifier: "provider", type: "string", multiple: false, required: false, systemKey: null,
  parentFieldId: null, archivedAt: null, rowVersion: 3, createdAt: "2026-09-27T00:00:00Z", updatedAt: "2026-09-27T00:00:00Z", updatedBy: null };
export const value: CustomFieldValue = { id: "value-a", workspaceId: "workspace-a", projectId: "project-a", fieldId: field.id,
  value: "Acme", label: "Acme", parentValueId: null, isLegacy: false, archivedAt: null, rowVersion: 2,
  createdAt: field.createdAt, updatedAt: field.updatedAt, updatedBy: null };
export const scope = { workspaceId: field.workspaceId, projectId: field.projectId };

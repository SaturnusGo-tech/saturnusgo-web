import type { DataType } from "../../../../../core/tms/contracts/test-data/bindings";
export type { DataType, StaticDefinition, TestDataBinding } from "../../../../../core/tms/contracts/test-data/bindings";
export type VariableSuggestion = { readonly token: string; readonly type: string; readonly source: string; readonly secret: boolean };
export type DataFinding = { readonly code: string; readonly message?: string; readonly alias?: string; readonly field?: string; readonly stepId?: string };
export type BindingSource = { readonly alias: string; readonly id: string; readonly name: string; readonly sourceType: string;
  readonly versionId?: string; readonly currentVersionId?: string; readonly version?: number;
  readonly environmentId?: string | null; readonly status?: "ACTIVE" | "ARCHIVED" | "active" | "disabled" };
export type BindingValidation = { readonly valid: boolean; readonly errors: readonly DataFinding[]; readonly warnings: readonly DataFinding[]; readonly variables: readonly VariableSuggestion[]; readonly referencedResources: readonly BindingSource[] };
export const dataTypes: readonly DataType[] = ["String", "Integer", "Decimal", "Boolean", "Email", "URL", "Date", "DateTime", "JSON"];

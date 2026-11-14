import type { DataType } from "../bindings/binding";
export type StaticResource = { readonly id: string; readonly name: string; readonly description: string; readonly environmentId: string | null;
  readonly dataType: DataType; readonly value: string | boolean; readonly status: "ACTIVE" | "ARCHIVED"; readonly revision: number;
  readonly currentVersionId: string; readonly createdAt: string; readonly updatedAt: string; readonly warnings: readonly { readonly code: "POTENTIAL_SENSITIVE_VALUE" }[] };
export type StaticResourceDraft = { readonly name: string; readonly description: string; readonly environmentId: string | null; readonly dataType: DataType; readonly value: string | boolean };

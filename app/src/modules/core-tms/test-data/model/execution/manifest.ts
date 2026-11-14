import type { DataFinding } from "../bindings/binding";
export type ExecutionDataSource = { readonly alias: string; readonly sourceType: "STATIC" | "DATASET" | "CREDENTIAL";
  readonly name: string; readonly sourceId?: string; readonly versionId?: string; readonly version?: number; readonly fields: readonly { readonly key: string; readonly type: string; readonly isSecret: boolean; readonly value?: string | boolean }[] };
export type DataManifest = { readonly executionId: string; readonly environmentId: string | null;
  readonly preparedAt: string; readonly sources: readonly ExecutionDataSource[] };
export type ExecutionScope = { readonly runId: string; readonly itemId: string; readonly attemptNo: number };
export type SecretProof = { readonly currentPassword: string; readonly code: string; readonly recovery: boolean };
export type SecretDisclosure = { readonly value: string; readonly expiresAt: number };
export type SecretTarget = { readonly resourceId: string; readonly field: string; readonly secretVersionId: string; readonly environmentId: string; readonly executionId?: string };

export type DataPreflight = { readonly valid: boolean; readonly nextAfter: number | null; readonly items: readonly { readonly itemId: string; readonly valid: boolean; readonly errors: readonly DataFinding[]; readonly warnings: readonly DataFinding[] }[] };

import type { BindingValidation, TestDataBinding } from "../../model/bindings/binding";
import type { Credential, CredentialDraft, Dataset, DatasetDraft, DatasetVersion, DataUsage, ResourcePage } from "../../model/resources/resource";
import type { DataManifest, DataPreflight, ExecutionScope, SecretDisclosure, SecretProof, SecretTarget } from "../../model/execution/manifest";
export interface TestDataPort {
  datasets(search: string, cursor: string | null, signal: AbortSignal, archived?: boolean, sort?: "name" | "updatedAt"): Promise<ResourcePage<Dataset>>;
  credentials(search: string, cursor: string | null, signal: AbortSignal, sort?: "name" | "updatedAt"): Promise<ResourcePage<Credential>>;
  dataset(id: string, signal: AbortSignal): Promise<Dataset>;
  credential(id: string, signal: AbortSignal): Promise<Credential>;
  versions(id: string, cursor: string | null, signal: AbortSignal): Promise<ResourcePage<DatasetVersion>>;
  version(id: string, versionId: string, signal: AbortSignal): Promise<DatasetVersion>;
  saveDataset(value: DatasetDraft, current: Dataset | null, key: string, signal: AbortSignal): Promise<Dataset>;
  archiveDataset(current: Dataset, restore: boolean, key: string, signal: AbortSignal): Promise<void>;
  saveCredential(value: CredentialDraft, current: Credential | null, key: string, signal: AbortSignal): Promise<Credential>;
  rotateCredential(current: Credential, values: Readonly<Record<string, string>>, key: string, signal: AbortSignal): Promise<void>;
  disableCredential(current: Credential, key: string, signal: AbortSignal): Promise<void>;
  usage(kind: "datasets" | "credentials", id: string, cursor: string | null, signal: AbortSignal): Promise<ResourcePage<DataUsage>>;
  validate(bindings: readonly TestDataBinding[], steps: readonly { id: string; action: string; expectedResult: string }[], signal: AbortSignal,
    savedCase?: { readonly caseId: string; readonly revision: number }): Promise<BindingValidation>;
  preflight(runId: string, after: number | null, signal: AbortSignal): Promise<DataPreflight>;
  manifest(scope: ExecutionScope, signal: AbortSignal): Promise<DataManifest | null>;
  reveal(target: SecretTarget, reason: string, proof: SecretProof, signal: AbortSignal): Promise<SecretDisclosure>;
}

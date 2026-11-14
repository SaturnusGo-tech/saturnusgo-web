import type { components, operations } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TestDataPort } from "../../application/ports/test-data-port";
import type { Credential } from "../../model/resources/resource";
type Api = components["schemas"];
type Listing = operations["listTdmCredentials"]["responses"][200]["content"]["application/json"];
type Port = Pick<TestDataPort, "credentials" | "credential" | "saveCredential" | "rotateCredential" | "disableCredential" | "reveal">;
function credential(value: Api["CredentialMetadata"]): Credential {
  return { id: value.id, name: value.name, description: value.description, environmentId: value.environmentId,
    revision: value.rowVersion, fields: value.fields.map(field => ({ ...field,
      ...(!field.isSecret && field.key in value.nonSecretValues ? { value: value.nonSecretValues[field.key] } : {}) })),
    activeSecretVersionId: value.activeSecretVersionId, usedIn: value.usedIn, updatedAt: value.updatedAt, disabled: value.status === "disabled" };
}
export function createCredentialClient(http: TmsHttpClient, base: string, workspaceId: string, projectId: string): Port {
  const path = (id: string) => `${base}/credentials/${encodeURIComponent(id)}`;
  return {
    async credentials(search, cursor, signal, sort = "name") {
      const query = new URLSearchParams({ q: search, limit: "50", ...(cursor ? { cursor } : {}), includeDisabled: "true", sort });
      const page = await http.get<Listing>(`${base}/credentials?${query}`, signal);
      return { items: page.data.map(credential), cursor: page.page.nextCursor };
    },
    async credential(id, signal) { return credential((await http.getResource<Api["CredentialMetadata"]>(path(id), signal)).data); },
    async saveCredential(value, current, key, signal) {
      const body: Api["CredentialDefinition"] | Api["CredentialMetadataPatch"] = current ? { name: value.name, description: value.description }
        : { name: value.name, description: value.description, environmentId: value.environmentId,
          fields: value.fields.map(field => ({ key: field.key, type: field.type, isSecret: Boolean(field.isSecret), value: field.value })) };
      return credential((await http.mutateResource<Api["CredentialMetadata"]>(current ? path(current.id) : `${base}/credentials`, current ? "PATCH" : "POST", body,
        { signal, idempotencyKey: key, ...(current ? { ifMatch: `"${current.revision}"` } : {}) })).data);
    },
    async rotateCredential(current, values, key, signal) {
      await http.mutateResource<Api["CredentialMetadata"]>(`${path(current.id)}/rotate`, "POST", { secrets: values } satisfies Api["CredentialRotation"],
        { signal, idempotencyKey: key, ifMatch: `"${current.revision}"` });
    },
    async disableCredential(current, key, signal) {
      await http.mutateResource<Api["CredentialMetadata"]>(`${path(current.id)}/disable`, "POST", {}, { signal, idempotencyKey: key, ifMatch: `"${current.revision}"` });
    },
    async reveal(target, reason, proof, signal) {
      const reauth: Api["ManagedReauthentication"] = { currentPassword: proof.currentPassword,
        ...(proof.code ? { secondFactor: { kind: proof.recovery ? "recovery" : "totp", code: proof.code } } : {}) };
      await http.mutate<void>("/profile/reauthenticate", "POST", reauth, signal);
      const request: Api["CredentialRevealProofRequest"] = { workspaceId, projectId, credentialId: target.resourceId,
        field: target.field, secretVersionId: target.secretVersionId, ...(target.executionId ? { executionId: target.executionId } : {}) };
      const grant = await http.mutate<Api["CredentialRevealProofResult"]>("/profile/credential-reveal-proof", "POST", request, signal);
      const body: Api["CredentialReveal"] = { field: target.field, secretVersionId: target.secretVersionId, environmentId: target.environmentId,
        stepUpProof: grant.proof, ...(reason.trim() ? { reason: reason.trim() } : {}), ...(target.executionId ? { executionId: target.executionId } : {}) };
      const response = await http.mutate<Api["CredentialRevealResult"]>(`${path(target.resourceId)}/reveal`, "POST", body, signal);
      return { value: response.value, expiresAt: Date.now() + Math.min(response.displayTimeoutSeconds, 30) * 1000 };
    },
  };
}

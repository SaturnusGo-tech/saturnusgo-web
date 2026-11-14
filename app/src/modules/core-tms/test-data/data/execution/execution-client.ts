import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TestDataPort } from "../../application/ports/test-data-port";
type Api = components["schemas"];
export function createExecutionDataClient(http: TmsHttpClient, projectId: string): Pick<TestDataPort, "validate" | "manifest" | "preflight"> {
  const project = `/projects/${encodeURIComponent(projectId)}`;
  return {
    async validate(bindings, steps, signal, savedCase) {
      const request: Api["TestDataValidationRequest"] = { bindings: bindings.map(binding => structuredClone(binding)), steps: steps.map(({ id, action, expectedResult }) => ({ id, action, expectedResult })),
        ...(savedCase ? { caseId: savedCase.caseId, revision: savedCase.revision } : {}) };
      const value = await http.mutate<Api["TestDataValidationResult"]>(`${project}/test-data/bindings:validate`, "POST", request, signal);
      return { valid: value.valid, errors: value.errors.map(error => ({ ...error })), warnings: value.warnings.map(warning => ({ ...warning })),
        variables: value.variables.map(variable => ({ token: `${variable.alias}.${variable.field}`, type: variable.type, source: variable.source, secret: variable.secret })),
        referencedResources: value.referencedResources.map(source => ({ ...source })) };
    },
    async manifest(scope, signal) {
      const value = (await http.getResource<Api["TestDataManifest"] | null>(`${project}/test-runs/${encodeURIComponent(scope.runId)}/items/${encodeURIComponent(scope.itemId)}/attempts/${scope.attemptNo}/test-data`, signal)).data;
      if (!value) return null;
      return { executionId: value.id, environmentId: value.environmentId, preparedAt: value.preparedAt,
        sources: value.sources.map(source => ({ alias: source.alias, sourceType: source.sourceType, sourceId: source.id, name: source.name, versionId: source.versionId,
          fields: source.fields.map(field => ({ key: field.key, type: field.type, isSecret: field.secret, ...(!field.secret && field.value !== undefined ? { value: field.value } : {}) })) })) };
    },
    async preflight(runId, after, signal) {
      const query = new URLSearchParams({ limit: "50" }); if (after !== null) query.set("after", String(after));
      const value = await http.mutate<Api["TestDataPreflightEnvelope"]["data"]>(`${project}/test-runs/${encodeURIComponent(runId)}/test-data:preflight?${query}`, "POST", {}, signal);
      return { valid: value.valid, nextAfter: value.nextAfter, items: value.items.map(item => ({ ...item, errors: item.errors.map(error => ({ ...error })), warnings: item.warnings.map(warning => ({ ...warning })) })) };
    },
  };
}

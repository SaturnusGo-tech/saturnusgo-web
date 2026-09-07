import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient, TmsMutationOptions } from "../../../../core/tms/transport/http";
import type { ImpactAnalysis, ImpactCommand, ImpactRepository, ImpactScope, RepositoryInput } from "../model/impact-types";
import { scopedAnalysis, scopedRepositories } from "./impact-scope";
type Api = components["schemas"];
const path = (scope: ImpactScope, suffix: string) => `/impact/${suffix}?${new URLSearchParams(scope)}`;
export function impactApi(http: TmsHttpClient) {
  return {
    list: async (scope: ImpactScope, signal: AbortSignal, before?: string, runId?: string) => {
      const result = await http.get<Api["ImpactAnalysisListEnvelope"]>(`${path(scope, "analyses")}${before ? `&before=${encodeURIComponent(before)}` : ""}${runId ? `&runId=${encodeURIComponent(runId)}` : ""}`, signal);
      return { ...result, data: result.data.map((item) => scopedAnalysis(scope, item, undefined, runId)) };
    },
    detail: async (scope: ImpactScope, id: string, signal: AbortSignal) => {
      const result = await http.getResource<ImpactAnalysis>(path(scope, `analyses/${encodeURIComponent(id)}`), signal);
      return { ...result, data: scopedAnalysis(scope, result.data, id) };
    },
    command: async (scope: ImpactScope, id: string, command: ImpactCommand, options: TmsMutationOptions) => {
      const result = await http.mutateResource<ImpactAnalysis>(path(scope, `analyses/${encodeURIComponent(id)}/${command.action}`), "POST", command.body, options);
      return { ...result, data: scopedAnalysis(scope, result.data, id) };
    },
    repositories: async (scope: ImpactScope, signal: AbortSignal) =>
      scopedRepositories(scope, (await http.get<{ data: ImpactRepository[] }>(path(scope, "repositories"), signal)).data),
    saveRepository: (scope: ImpactScope, id: string, input: RepositoryInput, options: TmsMutationOptions) =>
      http.mutateResource<ImpactRepository>(path(scope, `repositories/${encodeURIComponent(id)}`), "PATCH", input, options),
    history: (scope: ImpactScope, id: string, signal: AbortSignal, cursor?: string) =>
      http.get<Api["ActivityListEnvelope"]>(`/activity?${new URLSearchParams({ ...scope, entityType: "impact_analysis", entityId: id, limit: "20", ...(cursor ? { cursor } : {}) })}`, signal),
    cases: (scope: ImpactScope, query: string, signal: AbortSignal, cursor?: string) =>
      http.get<Api["TestCaseListEnvelope"]>(`/test-cases?${new URLSearchParams({ projectId: scope.projectId, limit: "50", lifecycle: "ready", ...(query ? { search: query } : {}), ...(cursor ? { cursor } : {}) })}`, signal),
  };
}

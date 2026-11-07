import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { BillingPlanId } from "../../domain/billing";
import type { PlanRequest, PlanRequestList } from "../domain/plan-request";

export function createPlanRequestApi(client: TmsHttpClient, workspaceId: string) {
  const path = `/workspaces/${encodeURIComponent(workspaceId)}/plan-requests`;
  return {
    list: async (signal: AbortSignal) => (await client.getResource<PlanRequestList>(path, signal)).data,
    get: async (id: string, signal: AbortSignal) => (await client.getResource<{ request: PlanRequest }>(`${path}/${encodeURIComponent(id)}`, signal)).data.request,
    submit: async (planId: BillingPlanId, locale: "en" | "ru", note: string) =>
      (await client.mutateResource<{ request: PlanRequest }>(path, "POST", { planId, locale, ...(note.trim() ? { note: note.trim() } : {}) })).data.request,
    act: async (request: PlanRequest, action: "withdraw" | "activate", setup?: { setupId: string; setupVersion: number }) =>
      (await client.mutateResource<{ request: PlanRequest }>(`${path}/${encodeURIComponent(request.id)}/${action}`, "POST", setup ?? {})).data.request,
  };
}

import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { mapProject } from "../../../projects/data/project-mapper";
import { mapPortfolio } from "../../data/portfolio-mapper";
import type { OrganizationPatch, OrganizationTarget } from "../model/organization";
export async function patchOrganization(http: TmsHttpClient, target: OrganizationTarget, patch: OrganizationPatch, etag: string, key: string, signal: AbortSignal) {
  const options = { ifMatch: etag, idempotencyKey: key, signal };
  const body = { ...(patch.name !== undefined ? { name: patch.name.trim() } : {}), ...(patch.description !== undefined ? { description: patch.description } : {}), ...(patch.responsibleIdentityId !== undefined ? { responsibleIdentityId: patch.responsibleIdentityId } : {}), ...(patch.workflowPhase !== undefined ? { workflowPhase: patch.workflowPhase } : {}), ...(patch.checklist !== undefined ? { checklist: patch.checklist.map((item) => ({ ...item, text: item.text.trim() })) } : {}) };
  if (target.targetType === "project") {
    const result = await http.mutateResource<components["schemas"]["Project"]>(`/projects/${encodeURIComponent(target.targetId)}`, "PATCH",
      { ...body, ...(patch.portfolioId !== undefined ? { portfolioId: patch.portfolioId } : {}), ...(patch.testingPlan !== undefined ? { testingPlan: patch.testingPlan } : {}) } satisfies components["schemas"]["ProjectPatchRequest"], options);
    return { kind: "project" as const, data: mapProject(result.data), etag: result.etag };
  }
  const result = await http.mutateResource<components["schemas"]["Portfolio"]>(`/portfolios/${encodeURIComponent(target.targetId)}`, "PATCH",
    body satisfies components["schemas"]["PortfolioPatchRequest"], options);
  return { kind: "portfolio" as const, data: mapPortfolio(result.data), etag: result.etag };
}

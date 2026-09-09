import type { Project } from "../../../../core/tms/contracts/legacy-contract";
import type { components } from "../../../../core/tms/generated/tms-api";
import { toTmsMutationFailure, type TmsMutationFailure } from "../../../../core/tms/errors/mutation-failure";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createProjectResource, updateProjectResource } from "../../projects/data/project-api";

import type { OrganizationPatch } from "../../portfolios/management/model/organization";

type Fields = OrganizationPatch & { name: string; key: string; description: string; testingPlan?: string; portfolioId?: string | null; responsibleIdentityId?: string | null };
type Result = { ok: true; project: Project; etag: string | null } | { ok: false; reason: "project"; failure: TmsMutationFailure };

export async function createProject(input: Fields & {
  http: TmsHttpClient; workspaceId: string; offline: boolean; operationKey: string; signal?: AbortSignal;
}): Promise<Result> {
  if (input.offline) return { ok: false, reason: "project", failure: { message: null, code: null, requestId: null } };
  const payload = {
    workspaceId: input.workspaceId, key: input.key.trim().toUpperCase(), name: input.name.trim(),
    description: input.description.trim(), portfolioId: input.portfolioId ?? null,
    testingPlan: input.testingPlan?.trim() ?? "",
    ...(input.workflowPhase !== undefined ? { workflowPhase: input.workflowPhase } : {}),
    ...(input.checklist !== undefined ? { checklist: input.checklist.map((item) => ({ ...item, text: item.text.trim() })) } : {}),
    responsibleIdentityId: input.responsibleIdentityId ?? null,
  } satisfies components["schemas"]["ProjectCreateRequest"];
  try {
    const resource = await createProjectResource(input.http, payload, input.operationKey, input.signal);
    return { ok: true, project: resource.data, etag: resource.etag };
  } catch (error) {
    input.signal?.throwIfAborted();
    return { ok: false, reason: "project", failure: toTmsMutationFailure(error) };
  }
}

export async function updateProject(input: Fields & {
  http: TmsHttpClient; project: Project; etag: string | null; offline: boolean; operationKey: string; signal?: AbortSignal;
}) {
  if (input.offline) throw new Error("Project updates require a server connection.");
  if (!input.etag) throw new Error("Project ETag is required for update.");
  const body = {
    name: input.name.trim(), description: input.description.trim(),
    ...(input.workflowPhase !== undefined ? { workflowPhase: input.workflowPhase } : {}),
    ...(input.checklist !== undefined ? { checklist: input.checklist.map((item) => ({ ...item, text: item.text.trim() })) } : {}),
    ...(input.testingPlan !== undefined ? { testingPlan: input.testingPlan.trim() } : {}),
    ...(input.portfolioId !== undefined ? { portfolioId: input.portfolioId } : {}),
    ...(input.responsibleIdentityId !== undefined ? { responsibleIdentityId: input.responsibleIdentityId } : {}),
  } satisfies components["schemas"]["ProjectPatchRequest"];
  return updateProjectResource(input.http, input.project.id, body, input.etag, input.operationKey, input.signal);
}

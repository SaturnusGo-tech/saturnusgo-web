import type { components } from "../../../../core/tms/generated/tms-api";
import type { Project } from "../../../../core/tms/contracts/legacy-contract";

export function mapProject(dto: components["schemas"]["Project"]): Project {
  return {
    id: dto.id,
    key: dto.key,
    name: dto.name,
    description: dto.description,
    testingPlan: dto.testingPlan,
    workflowPhase: dto.workflowPhase ?? "new",
    checklist: (dto.checklist ?? []).map((item) => ({ ...item })),
    status: dto.status,
    portfolioId: dto.portfolioId,
    responsibleIdentityId: dto.responsibleIdentityId,
    rowVersion: dto.rowVersion,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

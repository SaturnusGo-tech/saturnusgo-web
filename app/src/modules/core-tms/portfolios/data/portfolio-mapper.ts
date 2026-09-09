import type { components } from "../../../../core/tms/generated/tms-api";
import type { Portfolio } from "../model/portfolio";

export function mapPortfolio(dto: components["schemas"]["Portfolio"]): Portfolio {
  return { id: dto.id, workspaceId: dto.workspaceId, name: dto.name, description: dto.description,
    workflowPhase: dto.workflowPhase ?? "new", checklist: (dto.checklist ?? []).map((item) => ({ ...item })),
    responsibleIdentityId: dto.responsibleIdentityId, status: dto.status, archivedAt: dto.archivedAt,
    projectCount: dto.projectCount, createdAt: dto.createdAt, updatedAt: dto.updatedAt, rowVersion: dto.rowVersion };
}

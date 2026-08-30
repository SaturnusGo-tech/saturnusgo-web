import type { components } from "../../../../core/tms/generated/tms-api";
import type { Defect } from "../../../../core/tms/contracts/legacy-contract";

export function mapDefect(dto: components["schemas"]["Defect"]): Defect {
  return {
    id: dto.id,
    projectId: dto.projectId,
    key: dto.key,
    title: dto.title,
    description: dto.description,
    severity: dto.severity,
    priority: dto.priority,
    status: dto.status,
    reproducibility: dto.reproducibility,
    assigneeIdentityId: dto.assigneeIdentityId,
    component: dto.component,
    integrationTarget: dto.integrationTarget,
    externalIssue: dto.externalIssue,
    labels: [...dto.labels],
    runId: dto.occurrence?.runId ?? null,
    runItemId: dto.occurrence?.runItemId ?? null,
    stepId: dto.occurrence?.stepId ?? null,
    expectedResult: dto.expectedResult,
    actualResult: dto.actualResult,
    attachmentIds: [...dto.attachmentIds],
    linkIds: [...dto.linkIds],
    createdAt: dto.createdAt,
  };
}

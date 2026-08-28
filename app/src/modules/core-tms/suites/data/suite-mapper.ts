import type { components } from "../../../../core/tms/generated/tms-api";
import type { Suite, SuiteSummary } from "../../../../core/tms/contracts/legacy-contract";

type Api = components["schemas"];

export function mapSuiteSummary(dto: Api["SuiteSummary"]): SuiteSummary {
  return {
    id: dto.id,
    projectId: dto.projectId,
    key: dto.key,
    name: dto.name,
    description: dto.description,
    type: dto.type,
    caseCount: dto.caseCount,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapSuite(dto: Api["Suite"]): Suite {
  return {
    ...mapSuiteSummary(dto),
    caseIds: [...dto.caseIds],
    filter: { tags: dto.filter.tags ? [...dto.filter.tags] : undefined },
    resolvedCaseCount: dto.resolvedCaseCount,
  };
}

import type { components } from "../../../../core/tms/generated/tms-api";
import type { Environment } from "../../../../core/tms/contracts/legacy-contract";

export function mapEnvironment(dto: components["schemas"]["Environment"]): Environment {
  return {
    id: dto.id,
    projectId: dto.projectId,
    key: dto.key,
    name: dto.name,
    baseUrl: dto.baseUrl,
    description: dto.description,
    isDefault: dto.isDefault,
    status: dto.status,
  };
}

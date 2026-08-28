import type { components } from "../../../../core/tms/generated/tms-api";
import type { Project } from "../../../../core/tms/contracts/legacy-contract";

export function mapProject(dto: components["schemas"]["Project"]): Project {
  return {
    id: dto.id,
    key: dto.key,
    name: dto.name,
    description: dto.description,
    status: dto.status,
  };
}

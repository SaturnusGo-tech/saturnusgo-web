import type { components } from "../../../../core/tms/generated/tms-api";
import type { Dashboard } from "../../../../core/tms/contracts/legacy-contract";

export function mapDashboard(dto: components["schemas"]["Dashboard"]): Dashboard {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    isDefault: dto.isDefault,
    widgets: dto.widgets.map(({ id, type, title }) => ({ id, type, title })),
  };
}

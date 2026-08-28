import type { Dashboard } from "../../../../core/tms/contracts/legacy-contract";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createDashboardResource } from "../../dashboards/data/dashboard-api";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";

export async function createDashboard(input: {
  http: TmsHttpClient;
  workspaceId: string;
  projectId: string | null;
  name: string;
  description: string;
  offline: boolean;
  locale: TmsLocale;
  operationKey: string;
}): Promise<Dashboard> {
  const widgets = [
    {
      id: createUid("widget"),
      type: "summary",
      title: input.locale === "ru" ? "Статус ранов" : "Run status",
      position: { x: 0, y: 0, width: 12, height: 4 },
      settings: {},
    },
    {
      id: createUid("widget"),
      type: "defects",
      title: input.locale === "ru" ? "Открытые дефекты" : "Open defects",
      position: { x: 12, y: 0, width: 12, height: 4 },
      settings: {},
    },
  ] satisfies components["schemas"]["DashboardWidgetInput"][];
  if (input.offline) {
    return {
      id: createUid("dashboard"),
      name: input.name,
      description: input.description,
      isDefault: false,
      widgets: widgets.map(({ id, type, title }) => ({ id, type, title })),
    };
  }
  const body = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    name: input.name.trim(),
    description: input.description.trim(),
    isDefault: false,
    widgets,
  } satisfies components["schemas"]["DashboardCreateRequest"];
  return (await createDashboardResource(input.http, body, input.operationKey)).data;
}

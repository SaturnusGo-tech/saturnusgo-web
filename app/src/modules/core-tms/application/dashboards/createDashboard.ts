import type { Dashboard } from "../../../../core/tms/contracts/legacy-contract";
import { mutate } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";

export async function createDashboard(input: {
  workspaceId: string;
  projectId: string | null;
  name: string;
  description: string;
  offline: boolean;
  locale: TmsLocale;
}): Promise<Dashboard> {
  const widgets = [
    {
      id: createUid("widget"),
      type: "summary",
      title: input.locale === "ru" ? "Статус ранов" : "Run status",
      position: { x: 0, y: 0, w: 6, h: 4 },
      settings: {},
    },
    {
      id: createUid("widget"),
      type: "defects",
      title: input.locale === "ru" ? "Открытые дефекты" : "Open defects",
      position: { x: 6, y: 0, w: 6, h: 4 },
      settings: {},
    },
  ];
  if (input.offline) {
    return {
      id: createUid("dashboard"),
      name: input.name,
      description: input.description,
      isDefault: false,
      widgets: widgets.map(({ id, type, title }) => ({ id, type, title })),
    };
  }
  try {
    return await mutate<Dashboard>("/dashboards", "POST", {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      isDefault: false,
      widgets,
    });
  } catch (error) { throw error; }
}

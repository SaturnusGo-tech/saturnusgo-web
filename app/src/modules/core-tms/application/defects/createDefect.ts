import type { Defect } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";

type DefectPayload = Omit<Defect, "id" | "key" | "createdAt">;

export async function createDefect(input: {
  http: TmsHttpClient;
  projectId: string;
  payload: DefectPayload;
  files: File[];
  link?: string;
  offline: boolean;
  locale: TmsLocale;
}): Promise<Defect> {
  if (input.offline) {
    return {
      id: createUid("defect"),
      key: `BUG-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      ...input.payload,
    };
  }
  if (input.files.length > 0) {
    throw new Error("Legacy multipart attachment upload is disabled.");
  }
  let defect: Defect;
  try {
    defect = await input.http.mutate<Defect>("/defects", "POST", input.payload);
  } catch (error) {
    throw error;
  }
  if (input.link?.trim()) {
    const url = input.link.trim();
    await input.http.mutate("/links", "POST", {
      projectId: input.projectId,
      entityType: "defect",
      entityId: defect.id,
      label: input.locale === "ru" ? "Ссылка на дефект" : "Defect link",
      url,
      kind: url.startsWith("http") ? "url" : "deep_link",
    });
  }
  return defect;
}

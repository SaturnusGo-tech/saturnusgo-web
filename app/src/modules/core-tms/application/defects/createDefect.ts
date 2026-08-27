import type { Defect } from "../../../../core/tms/contracts/legacy-contract";
import {
  mutate,
  uploadAttachment,
} from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";

type DefectPayload = Omit<Defect, "id" | "key" | "createdAt">;

export async function createDefect(input: {
  projectId: string;
  payload: DefectPayload;
  files: File[];
  link?: string;
  offline: boolean;
}): Promise<Defect> {
  if (input.offline) {
    return {
      id: createUid("defect"),
      key: `BUG-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      ...input.payload,
    };
  }
  let defect: Defect;
  try {
    defect = await mutate<Defect>("/defects", "POST", input.payload);
  } catch (error) {
    throw error;
  }
  await Promise.all(
    input.files.map((file) =>
      uploadAttachment({
        projectId: input.projectId,
        entityType: "defect",
        entityId: defect.id,
        file,
      }),
    ),
  );
  if (input.link?.trim()) {
    const url = input.link.trim();
    await mutate("/links", "POST", {
      projectId: input.projectId,
      entityType: "defect",
      entityId: defect.id,
      label: "Defect link",
      url,
      kind: url.startsWith("http") ? "url" : "deep_link",
    });
  }
  return defect;
}

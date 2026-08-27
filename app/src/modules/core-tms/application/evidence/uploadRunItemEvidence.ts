import { uploadAttachment } from "../../../../core/tms/transport/http";

export function uploadRunItemEvidence(input: {
  projectId: string;
  runItemId: string;
  files: File[];
  offline: boolean;
}): Promise<void> {
  if (input.offline) return Promise.resolve();
  return Promise.all(
    input.files.map((file) =>
      uploadAttachment({
        projectId: input.projectId,
        entityType: "run_item",
        entityId: input.runItemId,
        file,
      }),
    ),
  ).then(() => undefined);
}

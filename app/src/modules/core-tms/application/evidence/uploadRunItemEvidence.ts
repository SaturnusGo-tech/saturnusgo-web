export function uploadRunItemEvidence(input: {
  projectId: string;
  runItemId: string;
  files: File[];
  offline: boolean;
}): Promise<void> {
  if (input.offline) return Promise.resolve();
  if (input.files.length === 0) return Promise.resolve();
  return Promise.reject(new Error("Legacy multipart attachment upload is disabled."));
}

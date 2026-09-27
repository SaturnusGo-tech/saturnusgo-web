import type { PrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";
import type { AttachmentMetadata, UploadPrivateAttachmentInput } from "../../../../attachments/domain/attachment";

export function buildArtifact(projectId = "project-a", id = `artifact-${projectId}`): AttachmentMetadata {
  return { id, projectId, owner: { kind: "project", projectId }, kind: "file", originalFilename: "release.apk",
    mimeType: "application/octet-stream", trustedExtension: "bin", byteSize: 3, sha256: "a".repeat(64),
    status: "ready", createdAt: "2026-09-27T00:00:00Z", updatedAt: "2026-09-27T00:00:00Z" };
}
export function buildClient(upload?: (input: UploadPrivateAttachmentInput) => Promise<AttachmentMetadata>) {
  const calls: UploadPrivateAttachmentInput[] = []; const removed: string[] = [];
  const client: PrivateAttachmentClient = {
    upload: async (input) => { calls.push(input); return upload ? upload(input) : buildArtifact(input.projectId!); },
    getMetadata: async (id) => ({ metadata: buildArtifact("project-a", id), etag: '"attachment:1"' }),
    remove: async (input) => { removed.push(input.attachmentId); return { metadata: buildArtifact(), etag: '"attachment:2"' }; },
    createAccess: async () => { throw new Error("Unused"); },
  };
  return { client, calls, removed };
}
export const buildFile = () => new File(["APK"], "release.apk", { type: "application/vnd.android.package-archive" });
export const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

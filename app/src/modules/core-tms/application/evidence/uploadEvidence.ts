import type { PrivateAttachmentClient } from "../../attachments/application/private-attachment-client";
import type {
  AttachmentKind, AttachmentMetadata, AttachmentMimeType, AttachmentOwner,
} from "../../attachments/domain/attachment";

const supported = new Set<AttachmentMimeType>([
  "image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4",
  "video/webm", "video/quicktime", "text/plain", "application/pdf",
  "application/json", "application/zip", "application/gzip",
  "application/octet-stream",
]);

const extensionMime: Record<string, AttachmentMimeType> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  gif: "image/gif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  txt: "text/plain", log: "text/plain", pdf: "application/pdf", json: "application/json",
  zip: "application/zip", gz: "application/gzip",
};

function mimeType(file: File): AttachmentMimeType {
  if (supported.has(file.type as AttachmentMimeType)) return file.type as AttachmentMimeType;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return extensionMime[extension] ?? "application/octet-stream";
}

function kind(mime: AttachmentMimeType, file: File): AttachmentKind {
  if (mime.startsWith("image/")) return "screenshot";
  if (mime.startsWith("video/")) return "video";
  if (mime === "text/plain" && /\.(?:log|txt)$/i.test(file.name)) return "log";
  return "file";
}

export async function uploadEvidence(input: {
  client: PrivateAttachmentClient;
  projectId: string;
  owner: AttachmentOwner;
  files: File[];
  operationKeyPrefix: string;
  signal?: AbortSignal;
}): Promise<AttachmentMetadata[]> {
  if (input.files.length > 20) throw new Error("A maximum of 20 evidence files can be uploaded together.");
  const uploaded: AttachmentMetadata[] = [];
  for (const [index, file] of input.files.entries()) {
    input.signal?.throwIfAborted();
    const mime = mimeType(file);
    uploaded.push(await input.client.upload({
      projectId: input.projectId,
      owner: input.owner,
      kind: kind(mime, file),
      mimeType: mime,
      file,
      operationKey: `${input.operationKeyPrefix}:${index}`,
      signal: input.signal,
    }));
  }
  return uploaded;
}

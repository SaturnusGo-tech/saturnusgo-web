import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import type { AttachmentMetadata, AttachmentUploadPhase } from "../../../attachments/domain/attachment";
import { AttachmentClientError } from "../../../attachments/domain/attachment-client-error";
import { MAX_BUILD_BYTES } from "../model/platform-build";

export function buildFileError(file: File, ru: boolean): string {
  if (!file.size) return ru ? "Файл сборки пуст." : "The build file is empty.";
  if (file.size > MAX_BUILD_BYTES) return ru ? "Файл сборки должен быть не больше 500 МиБ." : "The build file must be 500 MiB or smaller.";
  return "";
}

export async function uploadBuildFile(client: PrivateAttachmentClient, projectId: string, file: File,
  operationKey: string, signal: AbortSignal, onProgress: (phase: AttachmentUploadPhase) => void) {
  const error = buildFileError(file, false); if (error) throw new Error(error);
  const mimeType = /\.(apk|aab|zip)$/i.test(file.name) || ["application/zip", "application/x-zip-compressed"].includes(file.type)
    ? "application/zip" : /\.gz$/i.test(file.name) || ["application/gzip", "application/x-gzip"].includes(file.type)
      ? "application/gzip" : "application/octet-stream";
  const normalized = file.type === mimeType ? file : new File([file], file.name, { type: mimeType, lastModified: file.lastModified });
  const artifact = await client.upload({ projectId, owner: { kind: "project", projectId }, kind: "file",
    file: normalized, mimeType, operationKey, signal, onProgress });
  if (artifact.projectId !== projectId || artifact.owner.kind !== "project" || artifact.owner.projectId !== projectId
    || artifact.kind !== "file" || artifact.status !== "ready") throw new Error("The uploaded build is not ready in this project.");
  return artifact;
}

export function uploadBuildError(error: unknown, ru: boolean): string {
  if (error instanceof AttachmentClientError) {
    if (error.code === "PAYLOAD_TOO_LARGE") return ru ? "Файл сборки должен быть не больше 500 МиБ." : "The build file must be 500 MiB or smaller.";
    if (error.code === "UNSUPPORTED_MEDIA_TYPE") return ru ? "Сервер не принимает этот формат файла." : "The server does not accept this file format.";
    if (error.code === "FORBIDDEN") return ru ? "Нет доступа к загрузке сборки в этот проект." : "You cannot upload builds to this project.";
  }
  return ru ? "Не удалось загрузить сборку. Повторите попытку." : "Could not upload the build. Retry the upload.";
}

export async function removeStagedBuild(client: PrivateAttachmentClient, artifact: AttachmentMetadata,
  protectedId: (id: string) => boolean, operationKey: string) {
  if (protectedId(artifact.id)) return;
  const resource = await client.getMetadata(artifact.id);
  if (protectedId(artifact.id) || resource.metadata.status === "deleted" || resource.metadata.status === "deleting") return;
  await client.remove({ attachmentId: artifact.id, etag: resource.etag, operationKey });
}

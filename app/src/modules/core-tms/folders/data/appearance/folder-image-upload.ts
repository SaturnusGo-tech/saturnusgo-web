import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import type { RepositoryFolder } from "../../model/folder";
import { folderBase } from "../folder-api";
const supported = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"]);

export async function uploadFolderImage(http: TmsHttpClient, attachments: PrivateAttachmentClient,
  folder: RepositoryFolder, file: File, key: string, signal: AbortSignal, locale: "ru" | "en" = "en") {
  const ru = locale === "ru";
  signal.throwIfAborted();
  let mime = file.type.toLowerCase();
  if (!mime && /\.heic$/i.test(file.name)) mime = "image/heic";
  if (!mime && /\.heif$/i.test(file.name)) mime = "image/heif";
  if (!supported.has(mime)) throw new Error(ru ? "Выберите PNG, JPEG, WebP, AVIF, GIF или HEIC." : "Choose a PNG, JPEG, WebP, AVIF, GIF or HEIC image.");
  if (file.size < 1 || file.size > 10_485_760) throw new Error(ru ? "Выберите непустое изображение размером до 10 МБ." : "Choose a nonempty image under 10 MB.");
  if (!http.binary) throw new Error(ru ? "Загрузка изображений недоступна. Обновите страницу." : "Refresh the page to enable image uploads.");
  const response = await http.binary(`${folderBase(folder)}/${encodeURIComponent(folder.id)}/normalize-image`,
    file.type === mime ? file : file.slice(0, file.size, mime), signal);
  signal.throwIfAborted();
  const type = response.headers.get("content-type")?.split(";")[0];
  if (type !== "image/png" && type !== "image/gif") throw new Error("Unexpected normalized image type.");
  const blob = await response.blob(); signal.throwIfAborted();
  const normalized = new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "folder"}.${type === "image/gif" ? "gif" : "png"}`, { type });
  const metadata = await attachments.upload({ projectId: folder.projectId, owner: { kind: "repository_folder", folderId: folder.id },
    kind: "file", file: normalized, mimeType: type, operationKey: key, signal });
  signal.throwIfAborted();
  return metadata.id;
}

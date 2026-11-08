import type { LeafDirective } from "mdast-util-directive";
import type { components } from "../../../../../core/tms/generated/tms-api";

export const productDocAttachmentName = "falcon-file";
export const productDocAttachmentPattern = /^docfile_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const maxProductDocAttachmentBytes = 25 * 1024 * 1024;

const mimeExtensions: Record<string, string> = {
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "video/mp4": "mp4",
};
const extensions = new Set([...Object.values(mimeExtensions), "jpeg"]);
export const productDocAttachmentAccept = [...extensions].map(extension => `.${extension}`).join(",");
export const productDocMediaAccept = [
  ...Object.entries(mimeExtensions).filter(([mime]) => /^(image|audio|video)\//.test(mime)).map(([, extension]) => extension),
  "jpeg",
].map(extension => `.${extension}`).join(",");

export type ProductDocAttachment = components["schemas"]["ProductDocAttachment"];

export function attachmentFileName({ name, type }: Pick<File, "name" | "type">) {
  const extension = /\.([a-z\d]+)$/i.exec(name)?.[1].toLowerCase();
  if (extension) return extensions.has(extension) ? name : null;
  return mimeExtensions[type] ? `${name || "attachment"}.${mimeExtensions[type]}` : null;
}

export function readProductDocAttachment(attrs?: { attachment?: unknown; width?: unknown } | null) {
  const width = Number(attrs?.width);
  const attachment = typeof attrs?.attachment === "string" && productDocAttachmentPattern.test(attrs.attachment) ? attrs.attachment : "";
  return { attachment, width: Number.isInteger(width) && width >= 64 && width <= 4096 ? width : undefined };
}

export function markProductDocAttachment(node: LeafDirective) {
  if (node.name !== productDocAttachmentName) return false;
  node.data = { ...node.data, hName: productDocAttachmentName, hProperties: readProductDocAttachment(node.attributes), hChildren: [] };
  return true;
}

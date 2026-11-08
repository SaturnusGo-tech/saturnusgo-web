const privateImagePath = "/falcon/product-doc-images/";
const attachmentPattern = /^attachment_[a-z0-9_-]{1,100}$/i;
const widthPrefix = "falcon:image-width:";

export function imageAttachmentReference(id: string) {
  if (!attachmentPattern.test(id)) throw new Error("Invalid image attachment ID");
  return privateImagePath + id;
}

export function productDocImageAttachmentId(src: string | undefined) {
  if (!src?.startsWith(privateImagePath)) return null;
  const id = src.slice(privateImagePath.length);
  return attachmentPattern.test(id) ? id : null;
}

export function readProductDocImageTitle(value: string | null | undefined) {
  if (value?.startsWith(widthPrefix)) {
    const separator = value.indexOf(":", widthPrefix.length);
    const width = Number(value.slice(widthPrefix.length, separator));
    if (separator !== -1 && Number.isInteger(width) && width >= 0 && width <= 4096) {
      try { return { width: width || undefined, title: decodeURIComponent(value.slice(separator + 1)) }; }
      catch { /* A malformed marker is an ordinary title. */ }
    }
  }
  return { width: undefined, title: value ?? "" };
}

export function writeProductDocImageTitle(title: string | undefined, width: number | "inherit") {
  if (width === "inherit" && !title?.startsWith(widthPrefix)) return title || undefined;
  return widthPrefix + (width === "inherit" ? 0 : width) + ":" + encodeURIComponent(title ?? "");
}

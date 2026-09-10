import { AdministrationError } from "../domain/administration";

export async function avatarFileBase64(file: Blob, signal: AbortSignal): Promise<string> {
  if (file.size < 12 || file.size > 1_048_576 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new AdministrationError("INVALID_AVATAR");
  }
  signal.throwIfAborted();
  const bytes = new Uint8Array(await file.arrayBuffer());
  signal.throwIfAborted();
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}

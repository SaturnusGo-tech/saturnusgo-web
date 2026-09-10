import { prepareAvatarImage } from "./image/prepare-avatar-image";

export async function avatarFileBase64(file: Blob, signal: AbortSignal): Promise<string> {
  const image = await prepareAvatarImage(file, signal);
  signal.throwIfAborted();
  const bytes = new Uint8Array(await image.arrayBuffer());
  signal.throwIfAborted();
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}

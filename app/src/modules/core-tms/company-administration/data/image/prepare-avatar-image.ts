import { AdministrationError } from "../../domain/administration";

const UPLOAD_LIMIT = 1_048_576;
const SOURCE_LIMIT = 25 * UPLOAD_LIMIT;

export async function prepareAvatarImage(file: Blob, signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted();
  if (file.size < 12 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new AdministrationError("INVALID_AVATAR");
  }
  if (file.size > SOURCE_LIMIT) throw new AdministrationError("AVATAR_SOURCE_TOO_LARGE");
  if (file.size <= UPLOAD_LIMIT) return file;
  let bitmap: ImageBitmap | undefined;
  let canvas: HTMLCanvasElement | undefined;
  try {
    // Native decoding applies EXIF orientation. Resizing during decoding bounds the working image.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image", resizeWidth: 1024, resizeQuality: "high" });
    signal.throwIfAborted();
    if (!bitmap.width || !bitmap.height || bitmap.height > 16384) throw new AdministrationError("INVALID_AVATAR");
    canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new AdministrationError("INVALID_AVATAR");
    for (const [edge, quality] of [[1024, .88], [768, .82], [512, .76], [256, .7]]) {
      signal.throwIfAborted();
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const compressed = await new Promise<Blob | null>((resolve) => canvas!.toBlob(resolve, "image/webp", quality));
      signal.throwIfAborted();
      if (compressed && compressed.size >= 12 && compressed.size <= UPLOAD_LIMIT) return compressed;
    }
    throw new AdministrationError("INVALID_AVATAR");
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof AdministrationError) throw error;
    throw new AdministrationError("INVALID_AVATAR");
  } finally {
    bitmap?.close();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}

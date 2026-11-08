const maxImageBytes = 25 * 1024 * 1024;
const rasterTypes = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"]);

export async function fetchProductDocImage(url: string, sameOrigin: boolean, signal: AbortSignal): Promise<Blob | null> {
  const response = await fetch(url, {
    mode: sameOrigin ? "same-origin" : "cors",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
    signal,
  });
  const mimeType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const allowed = rasterTypes.has(mimeType) || (sameOrigin && mimeType === "image/svg+xml");
  const declaredLength = Number(response.headers.get("content-length"));
  if (!response.ok || !response.body || !allowed || declaredLength > maxImageBytes) {
    if (response.body) void response.body.cancel().catch(() => {});
    return null;
  }

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxImageBytes) {
        void reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  signal.throwIfAborted();
  return length ? new Blob(chunks, { type: mimeType }) : null;
}

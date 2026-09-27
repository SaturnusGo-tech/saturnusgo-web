import { useEffect, useRef, useState } from "react";
import { useAttachmentClient } from "../../../../attachments/presentation/context/AttachmentClientProvider";

export function useRunBuildDownload(attachmentId: string, ru: boolean) {
  const client = useAttachmentClient();
  const request = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    request.current = null; setPending(false); setError("");
    return () => request.current?.abort();
  }, [attachmentId, client]);
  async function download() {
    if (request.current && !request.current.signal.aborted) return;
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError("");
    try {
      const access = await client.createAccess({ attachmentId, disposition: "attachment", signal: controller.signal });
      if (controller.signal.aborted) return;
      const url = new URL(access.url);
      if (!["https:", "http:"].includes(url.protocol) || Object.keys(access.headers).length) throw new Error("Unsupported download");
      const link = document.createElement("a");
      link.href = url.href; link.download = ""; link.target = "_blank"; link.rel = "noopener noreferrer";
      document.body.append(link); link.click(); link.remove();
    } catch (failure) {
      if (!controller.signal.aborted) {
        const status = (failure as { status?: number }).status;
        setError(status === 401 ? (ru ? "Войдите снова, чтобы скачать сборку." : "Sign in again to download the build.")
          : status === 403 ? (ru ? "Нет доступа к сборке." : "You do not have access to this build.")
          : ru ? "Не удалось скачать сборку. Попробуйте ещё раз." : "Could not download the build. Try again.");
      }
    } finally {
      if (!controller.signal.aborted) setPending(false);
      controller.abort();
    }
  }
  return { pending, error, download };
}

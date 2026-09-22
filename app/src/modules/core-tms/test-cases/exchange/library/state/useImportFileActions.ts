import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../../attachments/presentation/context/AttachmentClientProvider";
import { importFileApi } from "../data/import-files";
import { readImportFile } from "../data/read-import-file";
import { importFileLink } from "../application/import-file-link";
import type { ImportFile, ImportScope } from "../model/import-file";

export function useImportFileActions(scope: ImportScope, ru: boolean, canManage: boolean, reload: () => void) {
  const client = useAttachmentClient();
  const http = useTmsHttpClient();
  const controller = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{ file: ImportFile; text: string } | null>(null);
  const [deletion, setDeletion] = useState<ImportFile | null>(null);
  const deleteKeys = useRef(new Map<string, string>());
  const refreshed = useRef(reload); refreshed.current = reload;
  useEffect(() => () => controller.current?.abort(), []);
  async function perform(action: (signal: AbortSignal) => Promise<void>) {
    if (controller.current && !controller.current.signal.aborted) return;
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setError(""); setNotice("");
    try { await action(abort.signal); }
    catch (failure) {
      if (!abort.signal.aborted) {
        const status = (failure as { status?: number }).status;
        setError(status === 401 ? (ru ? "Сессия завершилась. Войдите снова." : "Your session expired. Sign in again.")
          : status === 403 ? (ru ? "Нет доступа к этому файлу." : "You do not have access to this file.")
          : ru ? "Не удалось выполнить действие. Обновите историю и попробуйте снова." : "The action failed. Refresh the history and try again.");
      }
    } finally {
      if (!abort.signal.aborted) setPending(false);
      abort.abort();
    }
  }
  const open = (file: ImportFile) => perform(async signal => {
    setPreview({ file, text: "" });
    const text = await readImportFile(client, file.id, signal);
    if (!signal.aborted) setPreview({ file, text });
  });
  useEffect(() => {
    const id = new URL(window.location.href).searchParams.get("importFile");
    if (id && /^[A-Za-z0-9._:-]{1,128}$/.test(id)) void perform(async signal => {
      const file = await importFileApi.get(http, scope, id, signal);
      if (!file.available) { setNotice(ru ? "Исходный файл удалён или недоступен." : "The original file is deleted or unavailable."); return; }
      setPreview({ file, text: "" });
      const text = await readImportFile(client, file.id, signal);
      if (!signal.aborted) setPreview({ file, text });
    });
    return () => controller.current?.abort();
  }, [http, client, scope.workspaceId, scope.projectId]);
  return { pending, error, notice, preview, deletion, open,
    closePreview: () => { controller.current?.abort(); setPending(false); setPreview(null); },
    requestDelete: (file: ImportFile) => { if (canManage) { setError(""); setDeletion(file); } },
    cancelDelete: () => { if (!pending) setDeletion(null); },
    deleteFile: () => deletion && canManage && perform(async signal => {
      const resource = await client.getMetadata(deletion.id, signal);
      let key = deleteKeys.current.get(deletion.id);
      if (!key) { key = `import-delete:${crypto.randomUUID()}`; deleteKeys.current.set(deletion.id, key); }
      await client.remove({ attachmentId: deletion.id, etag: resource.etag, operationKey: key, signal });
      if (!signal.aborted) { setDeletion(null); refreshed.current(); }
    }),
    download: (file: ImportFile) => perform(async signal => {
      const access = await client.createAccess({ attachmentId: file.id, disposition: "attachment", fileName: file.fileName, signal });
      if (signal.aborted) return;
      const link = document.createElement("a"); link.href = access.url; link.rel = "noopener noreferrer";
      link.download = file.fileName; document.body.append(link); link.click(); link.remove();
    }),
    share: (file: ImportFile) => perform(async () => {
      await navigator.clipboard.writeText(importFileLink(window.location.href, file));
      setNotice(ru ? "Ссылка скопирована" : "Link copied");
    }),
  };
}

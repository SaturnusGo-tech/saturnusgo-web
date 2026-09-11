import { useEffect, useRef, useState } from "react";
import { useOptionalAttachmentClient } from "../../../../attachments/presentation/context/AttachmentClientProvider";
import { uploadEvidence } from "../../../../application/evidence/uploadEvidence";
import { AttachmentClientError } from "../../../../attachments/domain/attachment-client-error";
import type { AttachmentUploadPhase } from "../../../../attachments/domain/attachment";
import type { CommentAttachmentReference } from "../../../../test-cases/collaboration/model/attachments/comment-attachments";

export type CommentUpload = { key: string; name: string; file?: File; id?: string; phase: AttachmentUploadPhase; error?: string };
export function useCommentAttachments(projectId: string | undefined, initial: CommentAttachmentReference[], ru: boolean) {
  const client = useOptionalAttachmentClient();
  const [entries, setEntries] = useState<CommentUpload[]>(() => initial.map(item => ({ ...item, key: item.id, phase: "ready" })));
  const [problem, setProblem] = useState("");
  const current = useRef(entries);
  const active = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, [client, projectId]);
  function update(change: (items: CommentUpload[]) => CommentUpload[]) {
    current.current = change(current.current); setEntries(current.current);
  }
  async function run(items: CommentUpload[]) {
    if (!client || !projectId || active.current) return;
    const controller = new AbortController(); active.current = controller; setUploading(true);
    for (const item of items) {
      if (controller.signal.aborted) break;
      try {
        update(rows => rows.map(row => row.key === item.key ? { ...row, phase: "preparing", error: undefined } : row));
        const [metadata] = await uploadEvidence({ client, projectId, owner: { kind: "project", projectId }, files: [item.file!],
          operationKeyPrefix: item.key, signal: controller.signal,
          onProgress: (_file, phase) => { if (!controller.signal.aborted) update(rows => rows.map(row => row.key === item.key ? { ...row, phase } : row)); },
        });
        if (metadata.status !== "ready") throw new AttachmentClientError("INVALID_TRANSITION", "Attachment is not ready.");
        if (!controller.signal.aborted) update(rows => rows.map(row => row.key === item.key ? { ...row, id: metadata.id, phase: "ready" } : row));
      } catch (error) {
        if (controller.signal.aborted) break;
        const code = error instanceof AttachmentClientError ? error.code : "UPLOAD_FAILED";
        const message = code === "PAYLOAD_TOO_LARGE" ? (ru ? "Файл превышает допустимый размер." : "File exceeds the allowed size.")
          : code === "FORBIDDEN" ? (ru ? "Нет доступа к загрузке в этот проект." : "You cannot upload to this project.")
          : (ru ? "Файл не сохранён. Повторите загрузку." : "File was not saved. Retry the upload.");
        const requestId = error instanceof AttachmentClientError && error.requestId ? ` · requestId=${error.requestId}` : "";
        update(rows => rows.map(row => row.key === item.key ? { ...row, phase: "error", error: `${message} [${code}${requestId}]` } : row));
      }
    }
    if (!controller.signal.aborted) { active.current = null; setUploading(false); }
  }
  function add(files: File[]) {
    if (!client || !projectId || active.current || !files.length) return;
    if (current.current.length + files.length > 20) { setProblem(ru ? "Можно добавить до 20 файлов." : "You can attach up to 20 files."); return; }
    setProblem("");
    const added: CommentUpload[] = files.map(file => ({ key: crypto.randomUUID(), name: file.name, file, phase: "preparing" }));
    update(rows => [...rows, ...added]); void run(added);
  }
  return { entries, problem, uploading, enabled: Boolean(client && projectId), add,
    blocked: uploading || entries.some(item => item.phase !== "ready" || !item.id),
    references: entries.filter(item => item.id).map(item => ({ id: item.id!, name: item.name })),
    retry: (key: string) => { const entry = current.current.find(item => item.key === key); if (entry?.file) void run([entry]); },
    remove: (key: string) => { if (!active.current) { update(rows => rows.filter(item => item.key !== key)); setProblem(""); } },
  };
}

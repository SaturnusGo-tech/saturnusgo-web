import { ErrorToast } from "../../../../common/error/ErrorToast";
import { Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { AttachmentUploadProgress } from "../../../../../attachments/presentation/progress/AttachmentUploadProgress";
import type { useCommentAttachments } from "../useCommentAttachments";
import css from "./comment-attachments.module.css";
type State = ReturnType<typeof useCommentAttachments>;
export function CommentAttachmentButton({ state, pending, ru }: { state: State; pending: boolean; ru: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  return <><button type="button" className={css.attach} disabled={pending || state.uploading || !state.enabled}
    aria-label={ru ? "Прикрепить файл" : "Attach file"} title={ru ? "Прикрепить файл" : "Attach file"} onClick={() => input.current?.click()}><Paperclip size={16} /></button>
    <input ref={input} type="file" multiple hidden onChange={event => { state.add(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <span className={css.separator} aria-hidden="true" /></>;
}
export function CommentAttachmentList({ state, pending, ru }: { state: State; pending: boolean; ru: boolean }) {
  return <div className={css.files}>
    {state.entries.map(item => <div key={item.key} className={css.file}>
      <Paperclip size={14} /><div><span>{item.name}</span><AttachmentUploadProgress name={item.name} phase={item.phase === "ready" ? undefined : item.phase} locale={ru ? "ru" : "en"} />
        <ErrorToast message={item.error} retryLabel={ru ? "Повторить" : "Retry"}
          onRetry={item.phase === "error" && !pending && !state.uploading ? () => state.retry(item.key) : undefined} />
      </div>
      {item.phase === "error" && <button type="button" disabled={pending || state.uploading} onClick={() => state.retry(item.key)}>{ru ? "Повторить" : "Retry"}</button>}
      <button type="button" disabled={pending || state.uploading} onClick={() => state.remove(item.key)} aria-label={`${ru ? "Убрать вложение" : "Remove attachment"} ${item.name}`}><X size={14} /></button>
    </div>)}
    <ErrorToast message={state.problem} />
  </div>;
}

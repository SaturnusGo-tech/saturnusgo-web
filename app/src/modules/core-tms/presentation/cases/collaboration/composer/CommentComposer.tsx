import { useRef, useState } from "react";
import { Send, X, Reply } from "lucide-react";
import { MarkdownField } from "../../inspector/markdown/MarkdownField";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { CommentMentions } from "../mentions/CommentMentions";
import { useWorkspaceConnectors } from "../../../../connectors/application/context/WorkspaceConnectorContext";
import type { CommentDraft } from "../../../../test-cases/collaboration/model/drafts/comment-draft";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import { CommentBody } from "../attachments/CommentBody";
import { useCommentAttachments } from "../attachments/useCommentAttachments";
import { CommentAttachmentButton, CommentAttachmentList } from "../attachments/controls/CommentAttachmentControls";
import { readCommentAttachments, writeCommentAttachments } from "../../../../test-cases/collaboration/model/attachments/comment-attachments";
import css from "./comment-composer.module.css";
export function CommentComposer({ ru, projectId, initial, reply, pending, failure, onSubmit, onCancel, onClearReply, persistent = false }: {
  ru: boolean; projectId?: string; initial?: TestCaseComment; reply?: TestCaseComment;
  pending: boolean; failure: string; onSubmit: (draft: CommentDraft) => Promise<boolean>; onCancel: () => void;
  onClearReply?: () => void;
  persistent?: boolean;
}) {
  const [original] = useState(() => readCommentAttachments(initial?.body ?? ""));
  const [body, setBody] = useState(original.text);
  const files = useCommentAttachments(projectId, original.attachments, ru);
  const serialized = writeCommentAttachments(body, files.references);
  const submitting = useRef(false);
  const cannotSubmit = pending || files.blocked || !serialized.trim() || serialized.length > 10_000;
  const [mentions, setMentions] = useState<string[]>(initial?.mentions ?? []);
  const [slack, setSlack] = useState(false);
  const catalog = useWorkspaceConnectors();
  const slackConnected = catalog.connections.some((c) => c.projectId === projectId && c.provider === "slack" && c.enabled);
  async function submit() {
    if (cannotSubmit || submitting.current) return;
    submitting.current = true;
    try { await onSubmit({ body: serialized, parentId: reply?.id ?? null, mentions,
      notifyChannels: mentions.length && slack && slackConnected ? ["slack"] : [] });
    } finally { submitting.current = false; }
  }
  return <div className={css.composer} aria-busy={pending || files.uploading || undefined} onKeyDown={(event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
      event.preventDefault(); void submit();
    }
  }}>
    <div className={css.editorFrame} data-reply={Boolean(reply)}>
    <div ref={(element) => { if (element) element.inert = pending; }}>
      <MarkdownField allowAttachments={false} compact autoFocus={!persistent || Boolean(reply)} value={body}
        label={ru ? "Текст комментария" : "Comment text"} onChange={setBody}
        contextContent={reply && <div className={css.replyQuote} role="note" aria-label={ru ? "Исходное сообщение" : "Original message"}>
          <CommentBody body={reply.deletedAt ? (ru ? "Комментарий удалён" : "Comment deleted") : reply.body} ru={ru} />
        </div>} />
      {mentions.length > 0 && <div className={css.channels}>
        <label title={!slackConnected ? (ru ? "Подключите Slack в интеграциях проекта" : "Connect Slack in project integrations") : undefined}>
          <input type="checkbox" checked={slack && slackConnected} disabled={!slackConnected} onChange={(e) => setSlack(e.target.checked)} />{ru ? "Канал Slack проекта" : "Project Slack channel"}</label>
        <small>{ru ? "Упомянутые сотрудники получат уведомление в подключённых каналах." : "Mentioned teammates are notified through their connected channels."}</small>
      </div>}
    </div>
    {serialized.length > 10_000 && <p role="alert">{ru ? "Максимум 10 000 символов" : "Maximum 10,000 characters"}</p>}
    {failure && <p className={css.error} role="alert">{failure}</p>}
    <CommentAttachmentList state={files} pending={pending} ru={ru} />
    <footer><div className={css.mentions} ref={(element) => { if (element) element.inert = pending; }}><CommentAttachmentButton state={files} pending={pending} ru={ru} /><CommentMentions value={mentions} onChange={setMentions} ru={ru} /></div>
      <div className={css.submitActions}>{!persistent && <button type="button" disabled={pending} onClick={onCancel}>{ru ? "Отмена" : "Cancel"}</button>}
      <button type="button" className={css.send} disabled={cannotSubmit} onClick={() => void submit()}><Send size={14} />
        {pending ? (ru ? "Сохранение…" : "Saving…") : initial ? (ru ? "Сохранить" : "Save") : (ru ? "Отправить" : "Post")}</button></div></footer>
    {reply && <div className={css.reply}><Reply size={14} /><span>{ru ? "Ответить:" : "Reply to:"}</span>
      <span className={css.replyAuthor}><MemberAvatar identityId={reply.author.identityId} name={reply.author.displayName} />{reply.author.displayName}
        <button type="button" disabled={pending} onClick={onClearReply ?? onCancel} aria-label={ru ? "Убрать получателя ответа" : "Remove reply recipient"}><X size={14} /></button>
      </span></div>}
    </div>
  </div>;
}

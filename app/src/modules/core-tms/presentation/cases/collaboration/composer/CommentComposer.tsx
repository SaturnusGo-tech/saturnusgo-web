import { useState } from "react";
import { Send, X, Reply } from "lucide-react";
import { MarkdownField } from "../../inspector/markdown/MarkdownField";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { CommentMentions } from "../mentions/CommentMentions";
import { useWorkspaceConnectors } from "../../../../connectors/application/context/WorkspaceConnectorContext";
import type { CommentDraft } from "../../../../test-cases/collaboration/model/drafts/comment-draft";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import css from "./comment-composer.module.css";
export function CommentComposer({ ru, projectId, initial, reply, pending, failure, onSubmit, onCancel, onClearReply }: {
  ru: boolean; projectId?: string; initial?: TestCaseComment; reply?: TestCaseComment;
  pending: boolean; failure: string; onSubmit: (draft: CommentDraft) => Promise<boolean>; onCancel: () => void;
  onClearReply?: () => void;
}) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [mentions, setMentions] = useState<string[]>(initial?.mentions ?? []);
  const [slack, setSlack] = useState(false);
  const catalog = useWorkspaceConnectors();
  const slackConnected = catalog.connections.some((c) => c.projectId === projectId && c.provider === "slack" && c.enabled);
  async function submit() {
    if (pending || !body.trim() || body.length > 10_000) return;
    await onSubmit({ body, parentId: reply?.id ?? null, mentions,
      notifyChannels: mentions.length && slack && slackConnected ? ["slack"] : [] });
  }
  return <div className={css.composer} aria-busy={pending || undefined} onKeyDown={(event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
      event.preventDefault(); void submit();
    }
  }}>
    <div className={css.editorFrame} data-reply={Boolean(reply)}>
    <div ref={(element) => { if (element) element.inert = pending; }}>
      <MarkdownField allowAttachments={false} compact autoFocus value={body}
        label={ru ? "Текст комментария" : "Comment text"} onChange={setBody}
        contextContent={reply && <div className={css.replyQuote} role="note" aria-label={ru ? "Исходное сообщение" : "Original message"}>
          <MarkdownField value={reply.deletedAt ? (ru ? "Комментарий удалён" : "Comment deleted") : reply.body} label={ru ? "Исходное сообщение" : "Original message"} />
        </div>} />
      {mentions.length > 0 && <div className={css.channels}>
        <label title={!slackConnected ? (ru ? "Подключите Slack в интеграциях проекта" : "Connect Slack in project integrations") : undefined}>
          <input type="checkbox" checked={slack && slackConnected} disabled={!slackConnected} onChange={(e) => setSlack(e.target.checked)} />{ru ? "Канал Slack проекта" : "Project Slack channel"}</label>
        <small>{ru ? "Упомянутые сотрудники получат уведомление в подключённых каналах." : "Mentioned teammates are notified through their connected channels."}</small>
      </div>}
    </div>
    {body.length > 10_000 && <p role="alert">{ru ? "Максимум 10 000 символов" : "Maximum 10,000 characters"}</p>}
    {failure && <p className={css.error} role="alert">{failure}</p>}
    <footer><div className={css.mentions} ref={(element) => { if (element) element.inert = pending; }}><CommentMentions value={mentions} onChange={setMentions} ru={ru} /></div>
      <div className={css.submitActions}><button type="button" disabled={pending} onClick={onCancel}>{ru ? "Отмена" : "Cancel"}</button>
      {(Boolean(body.trim()) || pending) && <button type="button" className={css.send} disabled={pending || body.length > 10_000} onClick={() => void submit()}><Send size={14} />
        {pending ? (ru ? "Сохранение…" : "Saving…") : initial ? (ru ? "Сохранить" : "Save") : (ru ? "Отправить" : "Post")}</button>}</div></footer>
    </div>
    {reply && <div className={css.reply}><Reply size={14} /><span>{ru ? "Ответить:" : "Reply to:"}</span>
      <span className={css.replyAuthor}><MemberAvatar identityId={reply.author.identityId} name={reply.author.displayName} />{reply.author.displayName}
        <button type="button" disabled={pending} onClick={onClearReply ?? onCancel} aria-label={ru ? "Убрать получателя ответа" : "Remove reply recipient"}><X size={14} /></button>
      </span></div>}
  </div>;
}

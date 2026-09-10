import { useState } from "react";
import { Send, X, Reply } from "lucide-react";
import { MarkdownField } from "../../inspector/markdown/MarkdownField";
import { CommentMentions } from "../mentions/CommentMentions";
import { useWorkspaceConnectors } from "../../../../connectors/application/context/WorkspaceConnectorContext";
import type { CommentDraft } from "../../../../test-cases/collaboration/model/drafts/comment-draft";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import css from "./comment-composer.module.css";
export function CommentComposer({ ru, projectId, initial, reply, pending, failure, onSubmit, onCancel }: {
  ru: boolean; projectId?: string; initial?: TestCaseComment; reply?: TestCaseComment;
  pending: boolean; failure: string; onSubmit: (draft: CommentDraft) => Promise<boolean>; onCancel: () => void;
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
    {reply && <div className={css.reply}><Reply size={14} /><span>{ru ? "Ответ" : "Reply to"} {reply.author.displayName}</span>
      <button type="button" disabled={pending} onClick={onCancel} aria-label={ru ? "Отменить ответ" : "Cancel reply"}><X size={14} /></button></div>}
    <div ref={(element) => { if (element) element.inert = pending; }}>
      <MarkdownField allowAttachments={false} compact autoFocus value={body}
        label={ru ? "Текст комментария" : "Comment text"} onChange={setBody} />
      <CommentMentions value={mentions} onChange={setMentions} ru={ru} />
      {mentions.length > 0 && <div className={css.channels}>
        <label title={!slackConnected ? (ru ? "Подключите Slack в интеграциях проекта" : "Connect Slack in project integrations") : undefined}>
          <input type="checkbox" checked={slack && slackConnected} disabled={!slackConnected} onChange={(e) => setSlack(e.target.checked)} />{ru ? "Канал Slack проекта" : "Project Slack channel"}</label>
        <small>{ru ? "Упомянутые сотрудники получат уведомление в подключённых каналах." : "Mentioned teammates are notified through their connected channels."}</small>
      </div>}
    </div>
    {body.length > 10_000 && <p role="alert">{ru ? "Максимум 10 000 символов" : "Maximum 10,000 characters"}</p>}
    {failure && <p className={css.error} role="alert">{failure}</p>}
    <footer><button type="button" disabled={pending} onClick={onCancel}>{ru ? "Отмена" : "Cancel"}</button>
      <button type="button" className={css.send} disabled={pending || !body.trim() || body.length > 10_000} onClick={() => void submit()}><Send size={14} />
        {pending ? (ru ? "Сохранение…" : "Saving…") : initial ? (ru ? "Сохранить" : "Save") : (ru ? "Отправить" : "Post")}</button></footer>
  </div>;
}

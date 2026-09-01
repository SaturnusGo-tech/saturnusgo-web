import { AlertCircle, MessageSquare, RotateCw, Send } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { CaseCollaborationViewModel } from "../model";
import { activityActorLabel, commentFailureLabel } from "../model";
import inspector from "../../inspector/caseInspector.module.css";
import styles from "../../cases.module.css";
import css from "../caseCollaboration.module.css";

type Props = {
  caseId: string;
  locale: TmsLocale;
  languageTag: string;
  model: CaseCollaborationViewModel;
};

export function CaseCommentsTab({ caseId, locale, languageTag, model }: Props) {
  const ru = locale === "ru";
  const [body, setBody] = useState("");
  useEffect(() => { setBody(""); }, [caseId]);

  async function submit() {
    if (!body.trim() || model.commentSubmitting) return;
    if (await model.addComment(body)) setBody("");
  }

  function keyboardSubmit(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    void submit();
  }

  if (model.comments.status === "unavailable") return <Empty
    icon={<MessageSquare size={22} />}
    text={ru ? "Комментарии доступны после подключения к серверу" : "Comments are available when connected to the server"}
  />;
  if (model.comments.status === "loading") return <div
    className={css.loadState} role="status" aria-busy="true"
  >{ru ? "Загрузка комментариев…" : "Loading comments…"}</div>;
  if (model.comments.status === "error") return <div className={css.loadState} role="alert">
    <AlertCircle size={20} />
    <strong>{ru ? "Не удалось загрузить комментарии" : "Could not load comments"}</strong>
    <button type="button" onClick={model.retryComments}><RotateCw size={14} />{ru ? "Повторить" : "Retry"}</button>
  </div>;

  return <div className={styles.contextList}>
    {model.canComment && <div className={inspector.commentComposer}>
      <label className={css.composerLabel} htmlFor={`case-comment-${caseId}`}>
        {ru ? "Новый комментарий" : "New comment"}
      </label>
      <textarea
        id={`case-comment-${caseId}`}
        rows={3}
        maxLength={10_000}
        value={body}
        disabled={model.commentSubmitting}
        aria-invalid={Boolean(model.commentFailure)}
        aria-describedby={model.commentFailure ? `case-comment-error-${caseId}` : undefined}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={keyboardSubmit}
        placeholder={ru ? "Уточнение для команды…" : "Add context for the team…"}
      />
      {model.commentFailure && <span
        id={`case-comment-error-${caseId}`} className={css.inlineError} role="alert"
      ><AlertCircle size={13} />{commentFailureLabel(locale, model.commentFailure)}</span>}
      <div className={css.composerFooter}>
        <span>{ru ? "Ctrl/⌘ + Enter — отправить" : "Ctrl/⌘ + Enter to post"}</span>
        <button type="button" disabled={!body.trim() || model.commentSubmitting} onClick={() => { void submit(); }}>
          <Send size={13} />
          {model.commentSubmitting
            ? (ru ? "Отправка…" : "Posting…")
            : model.commentFailure ? (ru ? "Повторить" : "Retry")
            : (ru ? "Отправить" : "Post")}
        </button>
      </div>
    </div>}
    {model.comments.items.length === 0
      ? <Empty icon={<MessageSquare size={22} />} text={ru ? "Комментариев пока нет" : "No comments yet"} />
      : model.comments.items.map((comment) => <article className={css.comment} key={comment.id}>
          <span aria-hidden="true">{activityActorLabel(comment.author.displayName).slice(0, 1).toUpperCase()}</span>
          <div>
            <header><strong>{activityActorLabel(comment.author.displayName)}</strong><time dateTime={comment.createdAt}>
              {formatTime(comment.createdAt, languageTag)}
            </time></header>
            <p>{comment.body}</p>
          </div>
        </article>)}
    {(model.comments.hasMore || model.comments.loadMoreFailed) && <div className={css.pagination}>
      {model.comments.loadMoreFailed && <span role="alert">
        {ru ? "Не удалось загрузить предыдущие комментарии." : "Could not load older comments."}
      </span>}
      <button
        type="button"
        disabled={model.comments.loadingMore || model.comments.refreshing}
        aria-busy={model.comments.loadingMore || model.comments.refreshing || undefined}
        onClick={model.comments.hasMore ? model.loadMoreComments : model.refreshComments}
      >{model.comments.loadingMore || model.comments.refreshing
        ? (ru ? "Загрузка…" : "Loading…")
        : model.comments.loadMoreFailed
          ? model.comments.hasMore ? (ru ? "Повторить" : "Retry") : (ru ? "Обновить" : "Refresh")
        : (ru ? "Загрузить ещё" : "Load more")}</button>
    </div>}
  </div>;
}

function formatTime(value: string, languageTag: string) {
  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className={styles.tabEmpty}>{icon}<span>{text}</span></div>;
}

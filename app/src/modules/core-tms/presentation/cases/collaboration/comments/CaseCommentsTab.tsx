import { AlertCircle, MessageSquare, RotateCw, Send } from "lucide-react";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MarkdownField } from "../../inspector/markdown/MarkdownField";
import type { CaseCollaborationViewModel } from "../model";
import { activityActorLabel, commentFailureLabel } from "../model";
import styles from "../../cases.module.css";
import css from "../caseCollaboration.module.css";

type Props = {
  caseId: string;
  locale: TmsLocale;
  languageTag: string;
  model: CaseCollaborationViewModel;
};

export function CaseCommentsSection({ caseId, locale, languageTag, model }: Props) {
  const ru = locale === "ru";
  const [body, setBody] = useState("");
  useEffect(() => { setBody(""); }, [caseId]);

  async function submit() {
    if (!body.trim() || model.commentSubmitting) return;
    if (await model.addComment(body)) setBody("");
  }

  function keyboardSubmit(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    void submit();
  }

  let content: ReactNode;
  if (model.comments.status === "unavailable") {
    content = <Empty icon={<MessageSquare size={22} />} text={ru
      ? "Комментарии доступны после подключения к серверу"
      : "Comments are available when connected to the server"} />;
  } else if (model.comments.status === "loading") {
    content = <div className={`${css.loadState} ${css.sectionLoadState}`} role="status" aria-busy="true">
      {ru ? "Загрузка комментариев…" : "Loading comments…"}
    </div>;
  } else if (model.comments.status === "error") {
    content = <div className={`${css.loadState} ${css.sectionLoadState}`} role="alert">
      <AlertCircle size={20} />
      <strong>{ru ? "Не удалось загрузить комментарии" : "Could not load comments"}</strong>
      <button type="button" onClick={model.retryComments}><RotateCw size={14} />{ru ? "Повторить" : "Retry"}</button>
    </div>;
  } else {
    content = <>
      {model.canComment && <div className={css.commentComposer} onKeyDown={keyboardSubmit}
        aria-invalid={Boolean(model.commentFailure)}
        aria-describedby={model.commentFailure ? `case-comment-error-${caseId}` : undefined}>
        <span className={css.composerLabel}>{ru ? "Новый комментарий" : "New comment"}</span>
        <MarkdownField
          allowAttachments={false}
          value={body}
          label={ru ? "Текст комментария" : "Comment text"}
          compact
          autoFocus={false}
          onChange={(value) => setBody(value.slice(0, 10_000))}
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
              <div className={css.commentMarkdown}>
                <MarkdownField value={comment.body} label={ru ? "Комментарий" : "Comment"} />
              </div>
            </div>
          </article>)}
      {(model.comments.hasMore || model.comments.loadMoreFailed) && <div className={css.pagination}>
        {model.comments.loadMoreFailed && <span role="alert">
          {ru ? "Не удалось загрузить предыдущие комментарии." : "Could not load older comments."}
        </span>}
        <button type="button" disabled={model.comments.loadingMore || model.comments.refreshing}
          aria-busy={model.comments.loadingMore || model.comments.refreshing || undefined}
          onClick={model.comments.hasMore ? model.loadMoreComments : model.refreshComments}
        >{model.comments.loadingMore || model.comments.refreshing
          ? (ru ? "Загрузка…" : "Loading…")
          : model.comments.loadMoreFailed
            ? model.comments.hasMore ? (ru ? "Повторить" : "Retry") : (ru ? "Обновить" : "Refresh")
          : (ru ? "Загрузить ещё" : "Load more")}</button>
      </div>}
    </>;
  }

  return <section className={css.commentsSection} aria-labelledby={`case-comments-${caseId}`}>
    <header className={css.commentsHeading}>
      <MessageSquare size={15} />
      <h3 id={`case-comments-${caseId}`}>{ru ? "Комментарии" : "Comments"}</h3>
      {model.comments.status === "ready" && <span>{model.comments.items.length}</span>}
    </header>
    {content}
  </section>;
}

function formatTime(value: string, languageTag: string) {
  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className={styles.tabEmpty}>{icon}<span>{text}</span></div>;
}

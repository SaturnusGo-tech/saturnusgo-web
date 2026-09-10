import { AlertCircle, MessageSquare, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import { CommentComposer } from "../composer/CommentComposer";
import { CaseCommentRecord } from "../records/CaseCommentRecord";
import type { CaseCollaborationViewModel } from "../model";
import { commentFailureLabel } from "../model";
import css from "../caseCollaboration.module.css";
type Props = { caseId: string; locale: TmsLocale; languageTag: string; model: CaseCollaborationViewModel };
export function CaseCommentsSection({ caseId, locale, languageTag, model }: Props) {
  const ru = locale === "ru";
  const [composer, setComposer] = useState<{ reply?: TestCaseComment } | null>(null);
  const [navigationError, setNavigationError] = useState(false);
  const requested = useRef("");
  const composerRef = useRef<HTMLDivElement>(null);
  const currentCase = useRef(caseId); currentCase.current = caseId;
  const motion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" as const : "smooth" as const;
  async function reveal(id: string) {
    setNavigationError(false);
    if (!document.getElementById(`comment-${id}`) && !await model.revealComment?.(id)) {
      if (currentCase.current === caseId) setNavigationError(true);
      return;
    }
    requestAnimationFrame(() => {
      if (currentCase.current !== caseId) return;
      const element = document.getElementById(`comment-${id}`);
      element?.scrollIntoView({ block: "center", behavior: motion() }); element?.focus({ preventScroll: true });
    });
  }
  useEffect(() => { setComposer(null); setNavigationError(false); requested.current = ""; }, [caseId]);
  useEffect(() => {
    if (model.comments.status !== "ready") return;
    const id = new URL(window.location.href).searchParams.get("commentId");
    if (!id || requested.current === id || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) return;
    requested.current = id; void reveal(id);
  }, [caseId, model.comments.status]);
  useEffect(() => {
    if (composer) composerRef.current?.scrollIntoView({ block: "nearest", behavior: motion() });
  }, [composer]);
  return <section className={css.commentsSection} aria-labelledby={`case-comments-${caseId}`}>
    <header className={css.commentsHeading}><MessageSquare size={15} /><h3 id={`case-comments-${caseId}`}>{ru ? "Комментарии" : "Comments"}</h3>
      <button type="button" className={css.refreshComments} disabled={model.comments.refreshing || model.commentSubmitting || Boolean(model.changingCommentId)}
        onClick={model.refreshComments} aria-label={ru ? "Обновить комментарии" : "Refresh comments"}><RotateCw size={14} /></button></header>
    {model.comments.status === "loading" && <div className={css.commentSkeleton} role="status" aria-busy="true" aria-label={ru ? "Загрузка комментариев" : "Loading comments"}><span /><span /><span /></div>}
    {model.comments.status === "unavailable" && <p className={css.commentsEmpty}>{ru ? "Комментарии доступны при подключении к серверу" : "Connect to the server to view comments"}</p>}
    {model.comments.status === "error" && <div className={css.loadState} role="alert"><AlertCircle size={18} />
      <span>{ru ? "Не удалось загрузить комментарии" : "Could not load comments"}</span>
      <button type="button" onClick={model.retryComments}>{ru ? "Повторить" : "Retry"}</button></div>}
    {model.comments.status === "ready" && <>
      {model.canComment && <div ref={composerRef}>{composer
        ? <CommentComposer key={`${caseId}:${composer.reply?.id ?? "new"}`} ru={ru} projectId={model.commentProjectId}
            reply={composer.reply} pending={model.commentSubmitting || Boolean(model.changingCommentId)} failure={model.commentFailure ? commentFailureLabel(locale, model.commentFailure) : ""}
            onCancel={() => setComposer(null)} onSubmit={async (draft) => {
              const ok = await model.addComment(draft.body, draft);
              if (ok && currentCase.current === caseId) setComposer(null); return ok;
            }} />
        : <button type="button" className={css.commentPrompt} onClick={() => setComposer({})}><MessageSquare size={14} />{ru ? "Написать комментарий…" : "Write a comment…"}</button>}</div>}
      {navigationError && <p className={css.inlineError} role="alert">{ru ? "Не удалось открыть исходный комментарий. Попробуйте ещё раз." : "Could not open the original comment. Please retry."}</p>}
      {model.comments.items.map((comment) => <CaseCommentRecord key={comment.id} comment={comment} ru={ru} languageTag={languageTag}
        model={model} onReply={(reply) => setComposer({ reply })} onParent={(id) => void reveal(id)} />)}
      {(model.comments.hasMore || model.comments.loadMoreFailed) && <div className={css.pagination}>
        {model.comments.loadMoreFailed && <span role="alert">{ru ? "Не удалось загрузить предыдущие комментарии" : "Could not load older comments"}</span>}
        <button type="button" disabled={model.comments.loadingMore || model.comments.refreshing}
          onClick={model.comments.hasMore ? model.loadMoreComments : model.refreshComments}>
          {model.comments.loadingMore ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Загрузить ещё" : "Load more")}</button></div>}
    </>}
  </section>;
}

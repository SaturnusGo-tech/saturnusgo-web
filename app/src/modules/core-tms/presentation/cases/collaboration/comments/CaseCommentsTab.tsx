import { AlertCircle, MessageSquare, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import { CommentComposer } from "../composer/CommentComposer";
import { CommentThread } from "../threads/CommentThread";
import { commentTree } from "../threads/comment-tree";
import { useCommentAncestors } from "../ancestry/useCommentAncestors";
import { ExpandingComment } from "../expansion/ExpandingComment";
import { useCommentNavigation } from "../navigation/useCommentNavigation";
import type { CaseCollaborationViewModel } from "../model";
import { commentFailureLabel } from "../model";
import css from "../caseCollaboration.module.css";
type Props = { caseId: string; locale: TmsLocale; languageTag: string; model: CaseCollaborationViewModel; showRefresh?: boolean };
export function CaseCommentsSection({ caseId, locale, languageTag, model, showRefresh = true }: Props) {
  const ru = locale === "ru";
  useCommentAncestors(caseId, model);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [composer, setComposer] = useState<{ reply?: TestCaseComment }>({});
  const [composerVersion, setComposerVersion] = useState(0);
  const { failedId, reveal } = useCommentNavigation(caseId, model, () => setCollapsed(new Set()));
  const composerRef = useRef<HTMLDivElement>(null);
  const currentCase = useRef(caseId); currentCase.current = caseId;
  const motion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" as const : "smooth" as const;
  useEffect(() => { setComposer({}); setCollapsed(new Set()); }, [caseId]);
  useEffect(() => {
    if (!composer.reply) return;
    composerRef.current?.scrollIntoView({ block: "nearest", behavior: motion() });
    composerRef.current?.querySelector<HTMLElement>('[role="textbox"], textarea')?.focus({ preventScroll: true });
  }, [composer]);
  const editor = <CommentComposer key={`${caseId}:${composerVersion}`} ru={ru} projectId={model.commentProjectId} persistent
    reply={composer.reply} pending={model.commentSubmitting || Boolean(model.changingCommentId)} failure={model.commentFailure ? commentFailureLabel(locale, model.commentFailure) : ""}
    onClearReply={() => setComposer({})} onCancel={() => setComposer({})} onSubmit={async draft => {
      const ok = await model.addComment(draft.body, draft);
      if (ok && currentCase.current === caseId) { setComposer({}); setComposerVersion(value => value + 1); } return ok;
    }} />;
  return <section className={css.commentsSection} aria-labelledby={`case-comments-${caseId}`}>
    <header className={css.commentsHeading}><MessageSquare size={15} /><h3 id={`case-comments-${caseId}`}>{ru ? "Комментарии" : "Comments"}</h3>
      {showRefresh && <button type="button" className={css.refreshComments} disabled={model.comments.refreshing || model.commentSubmitting || Boolean(model.changingCommentId)}
        onClick={model.refreshComments} aria-label={ru ? "Обновить комментарии" : "Refresh comments"}><RotateCw size={14} /></button>}</header>
    {model.comments.status === "loading" && <div className={css.commentSkeleton} role="status" aria-busy="true" aria-label={ru ? "Загрузка комментариев" : "Loading comments"}><span /><span /><span /></div>}
    {model.comments.status === "unavailable" && <p className={css.commentsEmpty}>{ru ? "Комментарии доступны при подключении к серверу" : "Connect to the server to view comments"}</p>}
    {model.comments.status === "error" && <div className={css.loadState} role="alert"><AlertCircle size={18} />
      <span>{ru ? "Не удалось загрузить комментарии" : "Could not load comments"}</span>
      <button type="button" onClick={model.retryComments}>{ru ? "Повторить" : "Retry"}</button></div>}
    {model.comments.status === "ready" && <>
      {model.canComment && <div ref={composerRef}><ExpandingComment>{editor}</ExpandingComment></div>}
      {failedId && <div className={css.pagination} role="alert"><span>{ru ? "Комментарий недоступен или не удалось его загрузить." : "The comment is unavailable or could not be loaded."}</span>
        <button type="button" onClick={() => void reveal(failedId)}>{ru ? "Повторить" : "Retry"}</button></div>}
      {commentTree(model.comments.items).map(node => <CommentThread key={node.comment.id} node={node} ru={ru} languageTag={languageTag}
        model={model} collapsed={collapsed} toggle={id => setCollapsed(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; })}
        onReply={reply => { setComposer({ reply }); setCollapsed(old => { const next = new Set(old); next.delete(reply.id); return next; }); }}
        onParent={id => void reveal(id)} />)}
      {(model.comments.hasMore || model.comments.loadMoreFailed) && <div className={css.pagination}>
        {model.comments.loadMoreFailed && <span role="alert">{ru ? "Не удалось загрузить предыдущие комментарии" : "Could not load older comments"}</span>}
        <button type="button" disabled={model.comments.loadingMore || model.comments.refreshing}
          onClick={model.comments.hasMore ? model.loadMoreComments : model.refreshComments}>
          {model.comments.loadingMore ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Загрузить ещё" : "Load more")}</button></div>}
    </>}
  </section>;
}

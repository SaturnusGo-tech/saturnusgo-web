import { useState } from "react";
import { Pencil, Reply } from "lucide-react";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { CommentBody } from "../attachments/CommentBody";
import { CommentMenu } from "../menu/CommentMenu";
import { CommentComposer } from "../composer/CommentComposer";
import { buildCommentLink } from "../../../../test-cases/navigation/comments/comment-link";
import { CommentShareItem } from "../sharing/CommentShareItem";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import type { CaseCollaborationViewModel } from "../model";
import { commentFailureLabel, activityActorLabel } from "../model";
import css from "../caseCollaboration.module.css";
export function CaseCommentRecord({ comment, ru, languageTag, model, onReply, onParent, nested = false }: {
  comment: TestCaseComment; ru: boolean; languageTag: string; model: CaseCollaborationViewModel;
  nested?: boolean; onReply: (comment: TestCaseComment) => void; onParent: (id: string) => void;
}) {
  const [editing, setEditing] = useState<TestCaseComment | null>(null);
  const [confirming, setConfirming] = useState(false);
  const people = useWorkspacePeople();
  const parent = model.comments.items.find((item) => item.id === comment.parentId);
  const pending = Boolean(model.changingCommentId || model.commentSubmitting);
  const error = model.changeFailure ? commentFailureLabel(ru ? "ru" : "en", model.changeFailure) : "";
  const time = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const shareLink = () => buildCommentLink(window.location.href, { ...comment, targetKind: model.commentTargetKind, workspaceId: people.workspaceId });
  const edit = () => { setEditing(comment); setConfirming(false); };
  return <article className={css.comment} id={`comment-${comment.id}`} tabIndex={-1}>
    <MemberAvatar identityId={comment.author.identityId} name={activityActorLabel(comment.author.displayName)} />
    <div className={css.commentContent}>
      <header className={css.commentHeader}><div className={css.commentIdentity}><strong>{activityActorLabel(comment.author.displayName)}</strong>
        {!comment.deletedAt && Boolean(comment.mentions?.length) && <span className={css.mentionedPeople} role="group" aria-label={ru ? "Упомянутые сотрудники" : "Mentioned teammates"}>
          <span className={css.mentionVerb}>{ru ? "упоминает" : "mentioned"}</span>
          {comment.mentions!.map(id => <ResponsibleName key={id} workspaceId={people.workspaceId} identityId={id} offline={people.offline} />)}
        </span>}
        <span className={css.commentDate}><span aria-hidden="true">·</span><time dateTime={comment.createdAt}>{time.format(new Date(comment.createdAt))}</time></span>
        {comment.editedAt && !comment.deletedAt && <small title={time.format(new Date(comment.editedAt))}>{ru ? "изменён" : "edited"}</small>}
        <CommentShareItem ru={ru} link={shareLink} compact />
      </div><div className={css.commentActions} role="group" aria-label={ru ? "Действия" : "Actions"}>
        {model.canComment && !comment.deletedAt && <button type="button" className={css.commentAction} disabled={pending} onClick={() => onReply(comment)} aria-label={ru ? "Ответить" : "Reply"} title={ru ? "Ответить" : "Reply"}><Reply size={17} strokeWidth={1.6} /></button>}
        {comment.canEdit && model.changeComment && !comment.deletedAt && <button type="button" className={css.commentAction} disabled={pending} onClick={edit} aria-label={ru ? "Изменить комментарий" : "Edit comment"} title={ru ? "Изменить комментарий" : "Edit comment"}><Pencil size={16} strokeWidth={1.6} /></button>}
        <CommentMenu ru={ru} canEdit={Boolean(comment.canEdit && model.changeComment)}
          shareLink={shareLink}
          canDelete={Boolean(comment.canDelete && model.changeComment)} canReply={model.canComment && !comment.deletedAt}
          disabled={pending} onEdit={edit}
          onDelete={() => { setConfirming(true); setEditing(null); }} onReply={() => onReply(comment)} />
      </div></header>
      {comment.parentId && !nested && <button className={css.replyReference} type="button" onClick={() => onParent(comment.parentId!)}><Reply size={12} />
        {parent ? parent.deletedAt ? (ru ? "Ответ на удалённый комментарий" : "Reply to a deleted comment")
          : `${ru ? "Ответ" : "Reply to"} ${parent.author.displayName}` : (ru ? "Показать исходный комментарий" : "Show original comment")}</button>}
      {editing ? <CommentComposer key={comment.id} ru={ru} projectId={comment.projectId} initial={editing}
        pending={pending} failure={error} onCancel={() => setEditing(null)}
        onSubmit={async (draft) => { const ok = await model.changeComment?.(editing, draft); if (ok) setEditing(null); return Boolean(ok); }} />
        : comment.deletedAt ? <p className={css.deletedComment}>{ru ? "Комментарий удалён" : "Comment deleted"}</p>
        : <div className={css.commentMarkdown}>
          {parent && <blockquote className={css.parentQuote} aria-label={ru ? "Исходное сообщение" : "Original message"}>
            {parent.deletedAt ? <span>{ru ? "Комментарий удалён" : "Comment deleted"}</span> : <CommentBody body={parent.body} ru={ru} />}
          </blockquote>}
          <CommentBody body={comment.body} ru={ru} />
        </div>}
      {confirming && <div className={css.confirmDelete} role="group" aria-label={ru ? "Удалить комментарий?" : "Delete comment?"}>
        <span>{ru ? "Удалить комментарий? Ответы сохранятся." : "Delete this comment? Replies will remain."}</span>
        <button type="button" disabled={pending} onClick={() => setConfirming(false)}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="button" disabled={pending} onClick={async () => { if (await model.changeComment?.(comment, null)) setConfirming(false); }}>{ru ? "Удалить" : "Delete"}</button>
        {error && <span role="alert">{error}</span>}
      </div>}
    </div>
  </article>;
}

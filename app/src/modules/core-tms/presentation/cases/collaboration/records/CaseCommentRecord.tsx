import { useState } from "react";
import { Reply } from "lucide-react";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { MarkdownField } from "../../inspector/markdown/MarkdownField";
import { CommentMenu } from "../menu/CommentMenu";
import { CommentComposer } from "../composer/CommentComposer";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import type { CaseCollaborationViewModel } from "../model";
import { commentFailureLabel, activityActorLabel } from "../model";
import css from "../caseCollaboration.module.css";
export function CaseCommentRecord({ comment, ru, languageTag, model, onReply, onParent }: {
  comment: TestCaseComment; ru: boolean; languageTag: string; model: CaseCollaborationViewModel;
  onReply: (comment: TestCaseComment) => void; onParent: (id: string) => void;
}) {
  const [editing, setEditing] = useState<TestCaseComment | null>(null);
  const [confirming, setConfirming] = useState(false);
  const people = useWorkspacePeople();
  const parent = model.comments.items.find((item) => item.id === comment.parentId);
  const pending = Boolean(model.changingCommentId || model.commentSubmitting);
  const error = model.changeFailure ? commentFailureLabel(ru ? "ru" : "en", model.changeFailure) : "";
  const time = new Intl.DateTimeFormat(languageTag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return <article className={css.comment} id={`comment-${comment.id}`} tabIndex={-1}>
    <MemberAvatar identityId={comment.author.identityId} name={activityActorLabel(comment.author.displayName)} />
    <div className={css.commentContent}>
      <header><strong>{activityActorLabel(comment.author.displayName)}</strong>
        <time dateTime={comment.createdAt}>{time.format(new Date(comment.createdAt))}</time>
        {comment.editedAt && !comment.deletedAt && <small title={time.format(new Date(comment.editedAt))}>{ru ? "изменён" : "edited"}</small>}
        <CommentMenu ru={ru} canEdit={Boolean(comment.canEdit && model.changeComment)}
          canDelete={Boolean(comment.canDelete && model.changeComment)} canReply={model.canComment && !comment.deletedAt}
          disabled={pending} onEdit={() => { setEditing(comment); setConfirming(false); }}
          onDelete={() => { setConfirming(true); setEditing(null); }} onReply={() => onReply(comment)} />
      </header>
      {comment.parentId && <button className={css.replyReference} type="button" onClick={() => onParent(comment.parentId!)}><Reply size={12} />
        {parent ? parent.deletedAt ? (ru ? "Ответ на удалённый комментарий" : "Reply to a deleted comment")
          : `${ru ? "Ответ" : "Reply to"} ${parent.author.displayName}` : (ru ? "Показать исходный комментарий" : "Show original comment")}</button>}
      {editing ? <CommentComposer key={comment.id} ru={ru} projectId={comment.projectId} initial={editing}
        pending={pending} failure={error} onCancel={() => setEditing(null)}
        onSubmit={async (draft) => { const ok = await model.changeComment?.(editing, draft); if (ok) setEditing(null); return Boolean(ok); }} />
        : comment.deletedAt ? <p className={css.deletedComment}>{ru ? "Комментарий удалён" : "Comment deleted"}</p>
        : <div className={css.commentMarkdown}><MarkdownField value={comment.body} label={ru ? "Комментарий" : "Comment"} /></div>}
      {!comment.deletedAt && !editing && Boolean(comment.mentions?.length) && <div className={css.mentionedPeople}>
        {comment.mentions!.map((id) => <span key={id}>@<ResponsibleName workspaceId={people.workspaceId} identityId={id} offline={people.offline} /></span>)}
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

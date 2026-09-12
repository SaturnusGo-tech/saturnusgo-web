import { useState } from "react";
import { PiPencilSimple } from "react-icons/pi";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { MarkdownField } from "../../../../presentation/cases/inspector/markdown/MarkdownField";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { OrganizationComment } from "../../model/discussion";
import css from "./discussion-comment.module.css";

export function DiscussionComment({ item, canEdit, pending, onSave }: {
  item: OrganizationComment; canEdit: boolean; pending: boolean; onSave: (item: OrganizationComment, body: string) => Promise<boolean>;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [editing, setEditing] = useState(false);
  const [original, setOriginal] = useState(item);
  const [body, setBody] = useState(item.body);
  const [attempted, setAttempted] = useState(false);
  const error = attempted && (!body.trim() ? (ru ? "Введите комментарий." : "Enter a comment.") : body.trim().length > 20000 ? (ru ? "Не более 20 000 символов." : "Maximum 20,000 characters.") : "");
  return <li className={css.comment}>
    <header className={css.author}><MemberAvatar identityId={item.author.identityId} name={item.author.displayName} /><strong>{item.author.displayName}</strong>
      <time dateTime={item.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time>
      {item.updatedAt && <span title={new Date(item.updatedAt).toLocaleString(locale)}>{ru ? "изменён" : "edited"}</span>}
      {canEdit && !editing && <button type="button" disabled={pending} aria-label={ru ? "Редактировать комментарий" : "Edit comment"}
        onClick={() => { setOriginal(item); setBody(item.body); setAttempted(false); setEditing(true); }}><PiPencilSimple /></button>}
    </header>
    {editing ? <form onSubmit={async event => { event.preventDefault(); setAttempted(true);
      if (body.trim() && body.trim().length <= 20000 && await onSave(original, body)) setEditing(false);
    }} aria-busy={pending}>
      <MarkdownField appearance="plain" compact label={ru ? "Комментарий" : "Comment"} value={body} onChange={value => { if (!pending) setBody(value); }} allowAttachments={false} autoFocus />
      {error && <p role="alert">{error}</p>}
      <footer><button type="button" disabled={pending} onClick={() => setEditing(false)}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="submit" disabled={pending}>{pending ? (ru ? "Сохраняем…" : "Saving…") : (ru ? "Сохранить" : "Save")}</button></footer>
    </form> : <MarkdownField label={ru ? "Комментарий" : "Comment"} value={item.body} allowAttachments={false} />}
  </li>;
}

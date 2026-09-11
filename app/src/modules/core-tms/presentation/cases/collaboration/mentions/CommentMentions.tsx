import { useEffect, useRef, useState } from "react";
import { AtSign, Search, X } from "lucide-react";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { useWorkspaceMembers } from "../../../../workspace/members/state/useWorkspaceMembers";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { useMemberName } from "../../../../workspace/members/state/useMemberName";
import css from "./comment-mentions.module.css";
export function CommentMentions({ value, onChange, ru }: { value: string[]; onChange: (ids: string[]) => void; ru: boolean }) {
  const { workspaceId, offline } = useWorkspacePeople();
  const [open, setOpen] = useState(false);
  const members = useWorkspaceMembers(workspaceId, open && !offline);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector("input")?.focus();
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return <div className={css.root} ref={root} onKeyDown={(e) => {
    if (e.key === "Escape") { e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    {value.map((id) => <MentionName key={id} id={id} ru={ru} onRemove={() => onChange(value.filter((item) => item !== id))} />)}
    <button type="button" ref={trigger} className={css.add} disabled={offline || value.length >= 20}
      aria-expanded={open} onClick={() => setOpen(!open)}><AtSign size={14} />{ru ? "Призвать" : "Mention"}</button>
    {open && <div className={css.picker} role="dialog" aria-label={ru ? "Призвать сотрудника" : "Mention a teammate"}>
      <label className={css.search} data-input-shell><Search size={14} /><input value={members.search}
        aria-label={ru ? "Найти сотрудника" : "Find a teammate"} placeholder={ru ? "Имя или почта" : "Name or email"}
        maxLength={120} onChange={(e) => members.setSearch(e.target.value)} /></label>
      <div className={css.options}>
        {members.items.filter((m) => !value.includes(m.id)).map((member) => <button type="button" key={member.id}
          onClick={() => { onChange([...value, member.id]); setOpen(false); trigger.current?.focus(); }}>
          <MemberAvatar identityId={member.id} name={member.name} /><span>{member.name}<small>{member.email}</small></span>
        </button>)}
      </div>
      {members.loading && <p role="status">{ru ? "Загрузка…" : "Loading…"}</p>}
      {!members.loading && !members.error && !members.items.length && <p>{ru ? "Сотрудники не найдены" : "No teammates found"}</p>}
      {members.error && <button type="button" onClick={members.retry}>{ru ? "Повторить загрузку" : "Retry"}</button>}
      {members.cursor && <button type="button" disabled={members.loading} onClick={members.more}>{ru ? "Ещё" : "Load more"}</button>}
    </div>}
  </div>;
}
function MentionName({ id, ru, onRemove }: { id: string; ru: boolean; onRemove: () => void }) {
  const { workspaceId, offline } = useWorkspacePeople();
  const member = useMemberName(workspaceId, id, offline);
  return <span className={css.chip}><MemberAvatar identityId={id} name={member.name ?? ""} />
    {member.name || (ru ? "Сотрудник" : "Teammate")}<button type="button" onClick={onRemove}
      aria-label={ru ? "Убрать упоминание" : "Remove mention"}><X size={12} /></button></span>;
}

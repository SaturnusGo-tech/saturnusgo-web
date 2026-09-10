import { MemberAvatar } from "../avatar/MemberAvatar";
import { useEffect, useId, useRef, useState } from "react";
import { PiCaretDown, PiCheck, PiMagnifyingGlass } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useWorkspaceMembers } from "../state/useWorkspaceMembers";
import { useMemberName } from "../state/useMemberName";
import styles from "./responsible-picker.module.css";

export function ResponsiblePicker({ workspaceId, value, onChange, disabled = false, offline = false, selectedName }: {
  workspaceId: string; value: string | null; onChange: (value: string | null) => void; disabled?: boolean; offline?: boolean; selectedName?: string | null;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const label = ru ? "Ответственный" : "Responsible";
  const empty = ru ? "Не назначен" : "Not assigned";
  const [above, setAbove] = useState(false);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<{ id: string; name: string } | null>(null);
  const members = useWorkspaceMembers(workspaceId, open && !offline);
  const member = useMemberName(workspaceId, value, offline);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = members.items.find((item) => item.id === value)?.name ?? (chosen?.id === value ? chosen.name : selectedName) ?? member.name;
  useEffect(() => { if (disabled || offline) setOpen(false); }, [disabled, offline]);
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  function choose(id: string | null, name = "") {
    if (disabled || offline) return;
    onChange(id); setChosen(id ? { id, name } : null); setOpen(false); trigger.current?.focus();
  }
  return <div ref={root} className={styles.root} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} className={styles.trigger} type="button" disabled={disabled || offline} aria-label={label}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onClick={() => { const rect = trigger.current?.getBoundingClientRect(); setAbove(Boolean(rect && window.innerHeight - rect.bottom < 300 && rect.top > 300)); setOpen((current) => !current); }}>
      <MemberAvatar identityId={value} name={selected ?? ""} offline={offline} /><span className={styles.label}>{value ? selected || (ru ? "Назначенный участник" : "Assigned member") : empty}</span><PiCaretDown aria-hidden="true" />
    </button>
    {open && <div className={styles.popover} data-above={above}>
      <label className={styles.search} data-input-shell><PiMagnifyingGlass aria-hidden="true" /><input ref={search} value={members.search}
        placeholder={ru ? "Имя или почта" : "Name or email"} aria-label={ru ? "Найти участника" : "Find a member"}
        maxLength={120} onChange={(event) => members.setSearch(event.target.value)} onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>("[role=option]")?.focus(); }
        }} /></label>
      <div id={listId} role="listbox" aria-label={label} className={styles.options} onKeyDown={(event) => {
        const options = [...root.current!.querySelectorAll<HTMLButtonElement>("[role=option]")];
        const index = options.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); options[(index + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length]?.focus(); }
        if (event.key === "Home" || event.key === "End") { event.preventDefault(); options[event.key === "Home" ? 0 : options.length - 1]?.focus(); }
      }}>
        <button type="button" role="option" aria-selected={!value} onClick={() => choose(null)}><span className={styles.label}>{empty}</span>{!value && <PiCheck />}</button>
        {members.items.map((member) => <button type="button" key={member.id} role="option" aria-selected={value === member.id} onClick={() => choose(member.id, member.name)}>
          <MemberAvatar identityId={member.id} name={member.name} offline={offline} /><span className={styles.label}>{member.name}<small>{member.email}</small></span>{value === member.id && <PiCheck />}
        </button>)}
      </div>
      {members.loading && <p role="status">{ru ? "Загрузка…" : "Loading…"}</p>}
      {members.error && <button type="button" className={styles.more} onClick={members.retry}>{ru ? "Не удалось загрузить. Повторить" : "Could not load. Retry"}</button>}
      {members.cursor && <button type="button" disabled={members.loading} className={styles.more} onClick={members.more}>{ru ? "Загрузить ещё" : "Load more"}</button>}
    </div>}
  </div>;
}

"use client";
import { MoreHorizontal, Pencil, Ban, ShieldCheck, UserRoundMinus, KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CompanyMember, MemberChange } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "./member-actions.module.css";

export function MemberActions({ member, disabled, canManage, onEdit, onChange }: {
  readonly member: CompanyMember; readonly disabled: boolean; readonly canManage: boolean;
  readonly onEdit: () => void; readonly onChange: (change: MemberChange) => void;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [above, setAbove] = useState(false);
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) root.current?.removeAttribute("open"); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  function act(action: () => void) { root.current?.removeAttribute("open"); action(); }
  return <details className={styles.menu} ref={root} data-above={above} onToggle={() => {
    if (!root.current?.open) return;
    const bounds = root.current.getBoundingClientRect();
    setAbove(window.innerHeight - bounds.bottom < 210 && bounds.top > 210);
  }} onKeyDown={(event) => {
    if (event.key === "Escape") { event.preventDefault(); root.current?.removeAttribute("open"); root.current?.querySelector("summary")?.focus(); }
  }}>
    <summary aria-label={`${ru ? "Действия сотрудника" : "Person actions"}: ${member.name}`}><MoreHorizontal size={20} /></summary>
    <div className={styles.items}>
      <button disabled={disabled} onClick={() => act(onEdit)}><Pencil size={16} />{ru ? "Редактировать" : "Edit"}</button>
      <button disabled={disabled || !canManage} onClick={() => act(() => onChange({ kind: "status", status: member.status === "blocked" ? "active" : "blocked" }))}>
        {member.status === "blocked" ? <ShieldCheck size={16} /> : <Ban size={16} />}{member.status === "blocked" ? (ru ? "Разблокировать" : "Unblock") : (ru ? "Заблокировать" : "Block")}</button>
      <button disabled={disabled || !canManage} onClick={() => act(() => onChange({ kind: "reset_password", resetMfa: false }))}><KeyRound size={16} />{ru ? "Сбросить пароль" : "Reset password"}</button>
      <button className={styles.danger} disabled={disabled || !canManage} onClick={() => act(() => onChange({ kind: "status", status: "revoked" }))}><UserRoundMinus size={16} />{ru ? "Отозвать доступ" : "Revoke access"}</button>
    </div>
  </details>;
}

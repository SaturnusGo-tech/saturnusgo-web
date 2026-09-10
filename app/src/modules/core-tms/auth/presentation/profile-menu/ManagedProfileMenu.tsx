"use client";
import { Building2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TmsSessionIdentity } from "../session/TmsSessionContext";
import { ManagedAvatarImage } from "../../managed/presentation/avatar/ManagedAvatarImage";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import shell from "../../../tms.module.css";
import styles from "./profile-menu.module.css";

export function ManagedProfileMenu({ session }: { readonly session: TmsSessionIdentity }) {
  const { locale, t } = useTmsLocale();
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const ru = locale === "ru";
  useEffect(() => {
    if (!anchor) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setAnchor(null);
    };
    const close = () => setAnchor(null);
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", dismiss); window.removeEventListener("resize", close); };
  }, [anchor]);
  return <div className={shell.authSession}>
    <button ref={trigger} className={shell.authSessionButton} type="button" aria-label={ru ? "Меню профиля" : "Profile menu"}
      title={session.label} aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={() => {
        const rect = trigger.current?.getBoundingClientRect();
        setAnchor(anchor || !rect ? null : { left: Math.max(12, Math.min(rect.right + 10, window.innerWidth - 270)),
          bottom: Math.max(16, Math.min(window.innerHeight - rect.bottom, window.innerHeight - 290)) });
      }}>
      <ManagedAvatarImage className={shell.avatar} name={session.label} hasAvatar={Boolean(session.hasAvatar)} load={session.avatarLoader} />
    </button>
    {anchor && createPortal(<div ref={menu} className={styles.menu} role="menu" aria-label={ru ? "Профиль" : "Profile"}
      style={anchor} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== trigger.current) setAnchor(null); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); setAnchor(null); trigger.current?.focus(); return; }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }}>
      <div className={styles.name}>{session.label}</div>
      <a role="menuitem" href={session.profilePath ?? "/profile/"}><UserRound size={17} />{ru ? "Мой профиль" : "My profile"}</a>
      <a role="menuitem" href={`${session.profilePath ?? "/profile/"}#security`}><ShieldCheck size={17} />{ru ? "Безопасность" : "Security"}</a>
      {session.administrationPath && <a role="menuitem" href={session.administrationPath}><Building2 size={17} />{ru ? "Управление компанией" : "Company administration"}</a>}
      <button role="menuitem" type="button" disabled={pending} onClick={() => {
        setFailed(false); setPending(true);
        void session.signOut().catch(() => setFailed(true)).finally(() => setPending(false));
      }}><LogOut size={17} />{t("auth.signOut")}</button>
      {failed && <p className={styles.error} role="alert">{t("auth.logoutError")}</p>}
    </div>, document.body)}
  </div>;
}

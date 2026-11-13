"use client";
import { ProfileLink } from "../../../profile/presentation/ProfileLink";
import { BillingLink } from "../../../billing/presentation/link/BillingLink";
import { BillingPlanLink } from "../../../billing/composition/menu/BillingPlanLink";
import { memberRoleLabel } from "../../../company-administration/presentation/permissions/member-role-label";
import { CompanyAdministrationLink } from "../../../company-administration/composition/menu/CompanyAdministrationLink";
import { Building2, CreditCard, Download, LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { TeamLink } from "../../../team/presentation/TeamLink";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TmsSessionIdentity } from "../session/TmsSessionContext";
import { ManagedAvatarImage } from "../../managed/presentation/avatar/ManagedAvatarImage";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { DesktopDownloadsPanel } from "../../../desktop-downloads/presentation/DesktopDownloadsPanel";
import { useDesktopDownloadsAvailable } from "../../../desktop-downloads/presentation/useDesktopDownloadsAvailable";
import shell from "../../../tms.module.css";
import styles from "./profile-menu.module.css";

export function ManagedProfileMenu({ session }: { readonly session: TmsSessionIdentity }) {
  const { locale, t } = useTmsLocale();
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const downloadsAvailable = useDesktopDownloadsAvailable();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const ru = locale === "ru";
  const billingWorkspaceId = session.workspaceRole === "workspace_admin" ? session.workspaceId : null;
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
        if (downloadsOpen) { setDownloadsOpen(false); return; }
        const rect = trigger.current?.getBoundingClientRect();
        setAnchor(anchor || !rect ? null : { left: Math.max(12, Math.min(rect.right + 10, window.innerWidth - 270)),
          bottom: Math.max(16, Math.min(window.innerHeight - rect.bottom, window.innerHeight - 290)) });
      }}>
      <ManagedAvatarImage className={shell.avatar} name={session.label} hasAvatar={Boolean(session.hasAvatar)} load={session.avatarLoader} version={session.avatarVersion} />
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
      <div className={styles.name}>
        <strong>{session.label}</strong>
        {billingWorkspaceId
          ? <BillingPlanLink role="menuitem" workspaceId={billingWorkspaceId} className={styles.plan} onClick={() => setAnchor(null)} />
          : session.workspaceRole && <span className={styles.plan}>{memberRoleLabel(session.workspaceRole, locale)}</span>}
      </div>
      <ProfileLink role="menuitem" onClick={() => setAnchor(null)}><UserRound size={17} />{ru ? "Мой профиль" : "My profile"}</ProfileLink>
      <TeamLink role="menuitem" onClick={() => setAnchor(null)}><UsersRound size={17} />{ru ? "Моя команда" : "My team"}</TeamLink>
      <ProfileLink role="menuitem" section="security" onClick={() => setAnchor(null)}><ShieldCheck size={17} />{ru ? "Безопасность" : "Security"}</ProfileLink>
      {billingWorkspaceId && <BillingLink role="menuitem" workspaceId={billingWorkspaceId} onClick={() => setAnchor(null)}><CreditCard size={17} />{ru ? "Тариф и оплата" : "Plan and billing"}</BillingLink>}
      {downloadsAvailable && <button role="menuitem" type="button" onClick={() => { setAnchor(null); trigger.current?.focus({ preventScroll: true }); setDownloadsOpen(true); }}><Download size={17} strokeWidth={1.7} />{ru ? "Скачать приложение" : "Download app"}</button>}
      {session.administrationPath && <a role="menuitem" href={session.administrationPath}><Building2 size={17} />{ru ? "Управление компанией" : "Company administration"}</a>}
      {!session.administrationPath && <CompanyAdministrationLink role="menuitem" workspaceId={session.workspaceId ?? undefined} onClick={() => setAnchor(null)}><Building2 size={17} />{ru ? "Управление компанией" : "Company administration"}</CompanyAdministrationLink>}
      <button role="menuitem" type="button" disabled={pending} onClick={() => {
        setFailed(false); setPending(true);
        void session.signOut().catch(() => setFailed(true)).finally(() => setPending(false));
      }}><LogOut size={17} />{t("auth.signOut")}</button>
      {failed && <p className={styles.error} role="alert">{t("auth.logoutError")}</p>}
    </div>, document.body)}
    {downloadsAvailable && <DesktopDownloadsPanel open={downloadsOpen} anchor={trigger} onClose={() => setDownloadsOpen(false)} />}
  </div>;
}

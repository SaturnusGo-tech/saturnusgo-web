import { AvatarProfile, BuildingWorkspace, ChatTripleDots, Lifesaver, Logout, Settings } from "@openai/apps-sdk-ui/components/Icon";
import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import { ProfileLink } from "../../profile/presentation/ProfileLink";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { ManagedAvatarImage } from "../../auth/managed/presentation/avatar/ManagedAvatarImage";
import { SupportContact } from "../../support/composition/SupportContact";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { DesktopDownloadsPanel } from "../../desktop-downloads/presentation/DesktopDownloadsPanel";
import { useDesktopDownloadsAvailable } from "../../desktop-downloads/presentation/useDesktopDownloadsAvailable";
import { useRailPopup } from "../navigation/popup/useRailPopup";
import css from "./navigation-profile.module.css";

type Props = { collapsed: boolean; workspaceId: string; onOpenSettings(): void; onOpenHelp(): void };
const roles = {
  workspace_admin: ["Workspace administrator", "Администратор"], qa_manager: ["QA manager", "QA-менеджер"],
  tester: ["Tester", "Тестировщик"], reporter: ["Reporter", "Автор обращений"], viewer: ["Viewer", "Наблюдатель"],
} as const;

export function NavigationProfile({ collapsed, workspaceId, onOpenSettings, onOpenHelp }: Props) {
  const session = useOptionalTmsSession(), { locale, t } = useTmsLocale(), ru = locale === "ru";
  const popup = useRailPopup(), id = useId();
  const [pending, setPending] = useState(false), [failed, setFailed] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const downloadsAvailable = useDesktopDownloadsAvailable();
  const label = session?.label || t("auth.account");
  const role = session?.workspaceKind === "personal" ? (ru ? "Личный аккаунт" : "Personal account")
    : session?.kind === "cloud" && !session.workspaceKind ? (ru ? "Аккаунт Falcon" : "Falcon account")
    : session?.workspaceRole ? roles[session.workspaceRole][ru ? 1 : 0]
    : session?.kind === "admin" ? (ru ? "Администратор" : "Administrator") : (ru ? "Аккаунт Falcon" : "Falcon account");
  const navigate = (action: () => void) => { popup.dismiss(); action(); };
  return <div ref={popup.root} className={css.root} data-sidebar-independent data-collapsed={collapsed} onPointerEnter={event => { if (!downloadsOpen && event.pointerType !== "touch" && event.currentTarget.contains(event.target as Node)) popup.openHover(); }} onPointerLeave={popup.leave}>
    <button ref={popup.trigger} type="button" className={css.profile} data-collapsed={collapsed} data-active={popup.open}
      onClick={() => { setDownloadsOpen(false); popup.toggle(); }} onKeyDown={popup.triggerKeyDown} aria-label={`${t("auth.account")}: ${label}`}
      aria-haspopup="menu" aria-expanded={popup.open} aria-controls={popup.open ? id : undefined} data-testid="nav-account">
      <ManagedAvatarImage className={css.avatar} name={label} hasAvatar={Boolean(session?.hasAvatar)} load={session?.avatarLoader} version={session?.avatarVersion} />
      <span className={css.name}>{label}</span>
    </button>
    {typeof document !== "undefined" && createPortal(<div ref={popup.panel} id={id} className={css.menu}
      hidden={!popup.open} role="menu" aria-label={ru ? "Аккаунт" : "Account"} style={popup.position}
      onPointerEnter={popup.cancelClose} onPointerLeave={popup.leave} onKeyDown={event => {
        if (popup.open && event.currentTarget.contains(event.target as Node)) popup.panelKeyDown(event);
      }}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node) && !popup.root.current?.contains(event.relatedTarget as Node)) popup.dismiss(); }}>
      <div className={css.identity}>
        <ManagedAvatarImage className={css.avatar} name={label} hasAvatar={Boolean(session?.hasAvatar)} load={session?.avatarLoader} version={session?.avatarVersion} />
        <div><strong>{label}</strong><span>{role}</span></div>
      </div>
      <div className={css.separator} role="separator"/>
      {session && <ProfileLink role="menuitem" className={css.action} onClick={popup.dismiss}>
        <AvatarProfile width={20} height={20} aria-hidden="true"/><span>{ru ? "Мой профиль" : "My profile"}</span>
      </ProfileLink>}
      <button role="menuitem" type="button" className={css.action} data-testid="nav-config" onClick={() => navigate(onOpenSettings)}>
        <Settings width={20} height={20} aria-hidden="true"/><span>{t("nav.config")}</span>
      </button>
      {session && downloadsAvailable && <button role="menuitem" type="button" className={css.action} data-testid="account-download-app" onClick={() => { popup.close(true); setDownloadsOpen(true); }}>
        <Download size={20} strokeWidth={1.7} aria-hidden="true"/><span>{ru ? "Скачать приложение" : "Download app"}</span>
      </button>}
      {session?.administrationPath && <a role="menuitem" className={css.action} href={session.administrationPath} onClick={popup.dismiss}>
        <BuildingWorkspace width={20} height={20} aria-hidden="true"/><span>{ru ? "Управление компанией" : "Company administration"}</span>
      </a>}
      <div className={css.separator} role="separator"/>
      <button role="menuitem" type="button" className={css.action} data-testid="nav-help-utility" onClick={() => navigate(onOpenHelp)}>
        <Lifesaver width={20} height={20} aria-hidden="true"/><span>{t("nav.help")}</span>
      </button>
      <div className={css.support} onClickCapture={event => { if ((event.target as Element).closest("button")) popup.close(true); }}>
        <ChatTripleDots width={20} height={20} aria-hidden="true"/>
        <SupportContact menuItem workspaceId={workspaceId} navigationClasses={{ button: css.supportButton, icon: css.supportOriginalIcon, label: css.supportLabel }}/>
      </div>
      {session && <><div className={css.separator} role="separator"/>
        <button role="menuitem" type="button" className={css.action} disabled={pending} aria-busy={pending} data-testid="account-logout"
          onClick={() => {
            if (pending) return; setFailed(false); setPending(true);
            void session.signOut().catch(() => setFailed(true)).finally(() => setPending(false));
          }}><Logout width={20} height={20} aria-hidden="true"/><span>{t("auth.signOut")}</span></button>
      </>}
      {failed && <p className={css.error} role="alert">{t("auth.logoutError")}</p>}
    </div>, document.body)}
    {downloadsAvailable && <DesktopDownloadsPanel open={downloadsOpen} anchor={popup.trigger} onClose={() => setDownloadsOpen(false)} />}
  </div>;
}

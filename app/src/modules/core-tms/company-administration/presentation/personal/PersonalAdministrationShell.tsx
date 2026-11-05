"use client";
import { ArrowLeft, Bot, Building2, History, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { ManagedProfileMenu } from "../../../auth/presentation/profile-menu/ManagedProfileMenu";
import type { AdministrationRoute } from "../../application/navigation/useAdministrationNavigation";
import { personalAdministrationReturnUrl, personalAdministrationUrl } from "../../navigation/personal-administration-route";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function PersonalAdministrationShell({ workspaceId, companyName, page, onNavigate, children }: {
  workspaceId: string; companyName?: string; page?: "company" | "audit" | "codex";
  onNavigate(route: AdministrationRoute): void; children: ReactNode;
}) {
  const session = useTmsSession(), { locale } = useTmsLocale(), copy = administrationCopy(locale);
  const back = personalAdministrationReturnUrl(window.location.href, workspaceId);
  return <div className={styles.page} data-falcon-shell data-section="admin" data-directory={!page}>
    <aside className={styles.sidebar}>
      <a className={styles.brand} href={back}><img src="/falcon/falcon-mark-light.png" alt="" />Falcon</a>
      {companyName && <div className={styles.companyName}>{companyName}</div>}
      <nav className={styles.nav} aria-label={copy.admin} onClick={event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element).closest("a");
        if (!link) return;
        const url = new URL(link.href), next = url.searchParams.get("page");
        if (url.origin !== window.location.origin || url.pathname !== "/admin/") return;
        event.preventDefault(); onNavigate({ id: null, creating: false, ...(next === "company" || next === "audit" || next === "codex" ? { page: next } : {}) });
      }}>
        <a href={personalAdministrationUrl(window.location.href, workspaceId)} aria-current={!page ? "page" : undefined}><UsersRound size={17} />{copy.employees}</a>
        <a href={personalAdministrationUrl(window.location.href, workspaceId, "company")} aria-current={page === "company" ? "page" : undefined}><Building2 size={17} />{copy.companyDetails}</a>
        <a href={personalAdministrationUrl(window.location.href, workspaceId, "codex")} aria-current={page === "codex" ? "page" : undefined}><Bot size={17} />Codex</a>
        <a href={personalAdministrationUrl(window.location.href, workspaceId, "audit")} aria-current={page === "audit" ? "page" : undefined}><History size={17} />{locale === "ru" ? "Журнал действий" : "Activity log"}</a>
      </nav>
      <div className={styles.sidebarBottom}><ManagedProfileMenu session={session} /><a className={styles.returnLink} href={back}><ArrowLeft size={18} />{locale === "ru" ? "В Falcon" : "Back to Falcon"}</a></div>
    </aside>
    <main className={styles.main}><div className={styles.canvas}>{children}</div></main>
  </div>;
}

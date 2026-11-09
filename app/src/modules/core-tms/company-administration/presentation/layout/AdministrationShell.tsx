"use client";

import { History, Building2, Inbox, UsersRound, Bot, Shield } from "lucide-react";
import { FalconBrandMark } from "../../../../../shared/components/brand/FalconBrandMark";
import { CompanyAdminFrame } from "./CompanyAdminFrame";
import { AdministrationAccount } from "../account/AdministrationAccount";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { ReactNode } from "react";
import type { SignedInCompanySession } from "../../../auth/managed/domain/managed-access";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { administrationPage, type AdministrationRoute } from "../../application/navigation/useAdministrationNavigation";
import "../../../presentation/workspace/motion/motion.css";
import styles from "./administration.module.css";

export function AdministrationShell({ children, section, page, session, logout, onNavigate, client, companyName }: {
  readonly client: AdministrationPort; readonly companyName?: string;
  readonly onNavigate: (route: AdministrationRoute) => void;
  readonly page?: AdministrationRoute["page"]; readonly children: ReactNode; readonly section: "sandbox" | "admin" | "profile";
  readonly session: SignedInCompanySession; readonly logout: () => Promise<void>;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const navigation = <nav className={styles.nav} aria-label={copy.admin} onClick={(event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest("a");
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    const target = url.pathname.split("/")[1];
    if (target !== section && !(session.audience === "platform" && (target === "sandbox" || target === "profile"))) return;
    if (target !== "sandbox" && target !== "admin" && target !== "profile") return;
    event.preventDefault();
    const next = administrationPage(target, url.searchParams.get("page"));
    onNavigate({ section: target, id: null, creating: false, page: next });
  }}>
    {session.audience === "platform" ? <a href="/sandbox/" aria-current={section === "sandbox" && !page ? "page" : undefined}><Building2 size={17} />{copy.companies}</a>
      : session.identity.role === "workspace_admin" && <a href="/admin/" aria-current={section === "admin" && !page ? "page" : undefined}><UsersRound size={17} />{copy.employees}</a>}
    {session.audience === "platform" && <a href="/sandbox/?page=plan-requests" aria-current={section === "sandbox" && page === "plan-requests" ? "page" : undefined}><Inbox size={17} aria-hidden="true" />{locale === "ru" ? "Заявки на планы" : "Plan requests"}</a>}
    {session.audience === "tenant" && session.identity.role === "workspace_admin" && <a href="/admin/?page=company" aria-current={section === "admin" && page === "company" ? "page" : undefined}><Building2 size={17} />{copy.companyDetails}</a>}
    {session.audience === "tenant" && session.identity.role === "workspace_admin" && <a href="/admin/?page=codex" aria-current={section === "admin" && page === "codex" ? "page" : undefined}><Bot size={17} />Codex</a>}
    {session.audience === "tenant" && session.identity.role === "workspace_admin" && <a href="/admin/?page=sso" aria-current={section === "admin" && page === "sso" ? "page" : undefined}><Shield size={17} />{locale === "ru" ? "Единый вход" : "Single sign-on"}</a>}
    {(session.audience === "platform" || session.identity.role === "workspace_admin") && <a href={`${session.audience === "platform" ? "/sandbox/" : "/admin/"}?page=audit`} aria-current={page === "audit" ? "page" : undefined}><History size={17} />{locale === "ru" ? "Журнал действий" : "Activity log"}</a>}
  </nav>;
  const account = <AdministrationAccount session={session} client={client} logout={logout} onNavigate={onNavigate} />;
  if (section === "admin" && session.audience === "tenant") {
    return <CompanyAdminFrame back="/work/" companyName={companyName} page={page === "plan-requests" ? undefined : page} navigation={navigation} account={account}>
      {children}
    </CompanyAdminFrame>;
  }
  return <div className={styles.page} data-falcon-shell data-section={section}>
    <aside className={styles.sidebar}>
      <a className={styles.brand} href={session.audience === "platform" ? "/sandbox/" : "/work/"}>
        <FalconBrandMark className={styles.brandMark} />Falcon
      </a>
      {companyName && <div className={styles.companyName}>{companyName}</div>}
      {navigation}
      <div className={styles.sidebarBottom}>{account}</div>
    </aside>
    <main className={styles.main}><div className={styles.canvas}>{children}</div></main>
  </div>;
}

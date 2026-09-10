"use client";

import { History, Building2, UsersRound, UserRound, ArrowUpRight, LogOut, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import type { SignedInCompanySession } from "../../../auth/managed/domain/managed-access";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import styles from "./administration.module.css";

export function AdministrationShell({ children, section, page, session, logout }: {
  readonly page?: "company" | "audit"; readonly children: ReactNode; readonly section: "sandbox" | "admin" | "profile";
  readonly session: SignedInCompanySession; readonly logout: () => Promise<void>;
}) {
  const { locale, setLocale } = useTmsLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const copy = administrationCopy(locale);
  const [failed, setFailed] = useState(false);
  return <div className={styles.page}>
    <aside className={styles.sidebar}>
      <a className={styles.brand} href={session.audience === "platform" ? "/sandbox/" : "/testcases/umbrella-home/work/"}>
        <img src="/falcon/falcon-mark-light.png" alt="" />Falcon
      </a>
      <nav className={styles.nav} aria-label={copy.admin}>
        {session.audience === "platform" ? <a href="/sandbox/" aria-current={section === "sandbox" && !page ? "page" : undefined}><Building2 size={17} />{copy.companies}</a>
          : session.identity.role === "workspace_admin" && <a href="/admin/" aria-current={section === "admin" && !page ? "page" : undefined}><UsersRound size={17} />{copy.employees}</a>}
        {session.audience === "tenant" && session.identity.role === "workspace_admin" && <a href="/admin/?page=company" aria-current={section === "admin" && page === "company" ? "page" : undefined}><Building2 size={17} />{copy.companyDetails}</a>}
        {(session.audience === "platform" || session.identity.role === "workspace_admin") && <a href={`${session.audience === "platform" ? "/sandbox/" : "/admin/"}?page=audit`} aria-current={page === "audit" ? "page" : undefined}><History size={17} />{locale === "ru" ? "Журнал действий" : "Activity log"}</a>}
        <a href="/profile/" aria-current={section === "profile" ? "page" : undefined}><UserRound size={17} />{copy.profile}</a>
        {session.audience === "tenant" && <a href="/testcases/umbrella-home/work/"><ArrowUpRight size={17} />{copy.openFalcon}</a>}
      </nav>
      <div className={styles.sidebarBottom}>
        <nav className={styles.nav}>
          <button onClick={() => setLocale(locale === "ru" ? "en" : "ru")}>{locale === "ru" ? "English" : "Русский"}</button>
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            {locale === "ru" ? (resolvedTheme === "dark" ? "Светлая тема" : "Тёмная тема") : (resolvedTheme === "dark" ? "Light theme" : "Dark theme")}</button>
          <button onClick={() => { setFailed(false); void logout().catch(() => setFailed(true)); }}><LogOut size={17} />{copy.logout}</button>
        </nav>
        <div className={styles.account}>{session.identity.name}</div>
        {failed && <p className={styles.error} role="alert">{copy.requestFailed}</p>}
      </div>
    </aside>
    <main className={styles.main}><div className={styles.canvas}>{children}</div></main>
  </div>;
}

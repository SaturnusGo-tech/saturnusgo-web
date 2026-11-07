import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import styles from "./administration.module.css";

export function CompanyAdminFrame({ back, companyName, page, navigation, account, children }: {
  readonly back: string;
  readonly companyName?: string;
  readonly page?: "company" | "audit" | "codex" | "sso";
  readonly navigation: ReactNode;
  readonly account: ReactNode;
  readonly children: ReactNode;
}) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const returnLabel = locale === "ru" ? "Вернуться в Falcon" : "Back to Falcon";
  return <div className={styles.page} data-falcon-shell data-company-admin data-section="admin" data-directory={!page}>
    <header className={styles.topBar}>
      <a className={styles.brand} href={back}><img src="/falcon/falcon-mark-light.png" alt="" />Falcon</a>
      <span className={styles.workspaceName}>{companyName}</span>
    </header>
    <aside className={styles.sidebar}>
      <p className={styles.navTitle}>{copy.admin}</p>
      {navigation}
      <div className={styles.sidebarBottom}>
        <a className={styles.returnLink} href={back} aria-label={returnLabel} title={returnLabel}>
          <ArrowLeft size={18} aria-hidden="true" />
        </a>
        {account}
      </div>
    </aside>
    <main className={styles.main} key={page ?? "people"}><div className={styles.canvas}>{children}</div></main>
  </div>;
}

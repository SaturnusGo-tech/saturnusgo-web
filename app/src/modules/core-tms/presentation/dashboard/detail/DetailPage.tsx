import { ContentSkeleton } from "../../common/skeleton/ContentSkeleton";
import { ArrowUpRight, ListChecks, SearchX, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import surface from "../dashboard.module.css";
import shell from "../../../tms.module.css";
import styles from "./detail.module.css";

export function DetailPage({ title, context, count, action, onBack, children }: {
  title: string; context: string; count?: number;
  action?: { label: string; onClick: () => void }; onBack: () => void; children: ReactNode;
}) {
  const { t } = useTmsLocale(); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  return <div className={`${shell.pageScroll} ${surface.page} ${styles.page}`} data-dashboard-detail data-dashboard-workspace>
    <main className={styles.main}>
      <nav className={styles.breadcrumb} aria-label={t("dashboard.analyticsTitle")}>
        <button type="button" onClick={onBack}>{t("dashboard.analyticsTitle")}</button>
        <span>{context}</span>
      </nav>
      <header className={styles.heading}><h1 ref={heading} tabIndex={-1}>{title}{count !== undefined && <span>{count}</span>}</h1>
        {action && <button type="button" className={styles.quiet} onClick={action.onClick}>{action.label}<ArrowUpRight size={15} /></button>}
      </header>{children}
    </main>
  </div>;
}

export function DetailState({ loading, error, empty, filtered, onRetry }: {
  loading: boolean; error?: string | null; empty: boolean; filtered?: boolean; onRetry: () => void;
}) {
  const { locale, t } = useTmsLocale();
  if (error) return <div className={styles.failure} role="alert"><span>{error}</span>
    <button type="button" className={styles.quiet} onClick={onRetry}><RefreshCw size={14} />{t("dashboard.retry")}</button></div>;
  if (loading) return <ContentSkeleton variant="list" label={t("dashboard.drillLoading")} />;
  if (!empty) return null;
  return <div className={styles.state}>{filtered ? <SearchX size={27} strokeWidth={1.25} /> : <ListChecks size={27} strokeWidth={1.25} />}
    <strong>{locale === "ru" ? filtered ? "Совпадений нет" : "Здесь пока нет записей" : filtered ? "No matches" : "No records yet"}</strong>
    <p>{locale === "ru" ? filtered ? "Измените поисковый запрос или фильтры." : "В выбранном контексте нет данных для этого списка."
      : filtered ? "Try another search or adjust the filters." : "There are no records in this context."}</p>
  </div>;
}

export function DetailFooter({ shown, total, more, loading, onMore }: {
  shown: number; total?: number; more: boolean; loading: boolean; onMore: () => void;
}) {
  const { locale, t } = useTmsLocale();
  if (!more && (total === undefined || shown === total)) return null;
  return <footer className={styles.footer}>
    <span>{locale === "ru" ? "Показано" : "Showing"} {shown}{total !== undefined && <> {locale === "ru" ? "из" : "of"} {total}</>}</span>
    {more && <button type="button" className={styles.quiet} onClick={onMore} disabled={loading}>{loading && <LoaderCircle className={surface.spin} size={14} />}{t("dashboard.loadMore")}</button>}
  </footer>;
}

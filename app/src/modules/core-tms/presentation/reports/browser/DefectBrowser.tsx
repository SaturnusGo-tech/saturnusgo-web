import { ArrowDownWideNarrow, ArrowUpWideNarrow, Bug, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { useDefectBrowser } from "../../../defects/browser/state/useDefectBrowser";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { DefectBranch } from "../branches/DefectBranch";
import styles from "./defect-browser.module.css";

export function DefectBrowser({ workspaceId, projectId, projectName, connected, defects, query, onQueryChange,
  severitySort, onSeveritySortChange, selectedDefectId, onSelectDefect, onNew }: {
  workspaceId?: string; projectId?: string; projectName: string; connected: boolean; defects: Defect[];
  query: string; onQueryChange: (query: string) => void; severitySort: "asc" | "desc" | null;
  onSeveritySortChange: (value: "asc" | "desc" | null) => void;
  selectedDefectId: string | null; onSelectDefect: (id: string) => void; onNew: () => void;
}) {
  const { locale, t } = useTmsLocale();
  const browser = useDefectBrowser({ workspaceId, projectId, connected, query, defects, severitySort, selectedDefectId });
  const [expanded, setExpanded] = useState<string[]>([]);
  useEffect(() => { setExpanded([]); }, [query, projectId]);
  useEffect(() => {
    if (!browser.groups.length) return;
    setExpanded((current) => current.some((component) => browser.groups.some((group) => group.component === component))
      ? current : [browser.groups[0].component]);
  }, [browser.groups]);
  useEffect(() => { expanded.forEach(browser.openComponent); }, [expanded, browser.openComponent, browser.groups]);
  const loading = browser.groupsStatus === "loading" || browser.groupsStatus === "idle";
  const sortLabel = locale === "ru" ? "Сортировать по серьёзности" : "Sort by severity";
  const retryLabel = locale === "ru" ? "Повторить" : "Retry";
  function toggle(component: string) {
    setExpanded((current) => current.includes(component) ? current.filter((value) => value !== component) : [...current, component]);
  }
  return <section className={styles.pane} aria-label={t("reports.title")}>
    <header className={styles.header}>
      <h1>{locale === "ru" ? "Баг-репорты" : "Bug reports"}</h1>
    </header>
    <div className={styles.toolbar}>
      <label className={styles.search} data-input-shell>
        <Search size={17} aria-hidden="true" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} maxLength={200}
          placeholder={locale === "ru" ? "Найти баг-репорт" : "Find a bug report"}
          aria-label={t("reports.searchPlaceholder")} />
      </label>
      <button type="button" className={styles.sort} aria-label={sortLabel} title={sortLabel}
        aria-pressed={Boolean(severitySort)} data-direction={severitySort ?? undefined}
        onClick={() => onSeveritySortChange(severitySort === "desc" ? "asc" : severitySort === "asc" ? null : "desc")}>
        {severitySort === "asc" ? <ArrowUpWideNarrow size={18} /> : <ArrowDownWideNarrow size={18} />}
      </button>
      <button type="button" className={styles.newButton} onClick={onNew}><Plus size={16} />{t("reports.newBug")}</button>
    </div>
    <div className={styles.summary}>
      <strong>{projectName || (locale === "ru" ? "Проект" : "Project")}</strong>
      {browser.totals && <span className={styles.total}>{browser.totals.total}</span>}
      {browser.totals && <span className={styles.metrics}>
        <span>{browser.totals.open} {t("reports.openShort")}</span>
        <span title={locale === "ru" ? "Открытые критические баги" : "Open critical bugs"}>
          {browser.totals.critical} {t("reports.criticalShort")}</span>
      </span>}
    </div>
    <div className={styles.viewport} aria-busy={loading}>
      <ul className={styles.groups} aria-label={locale === "ru" ? "Компоненты и баги" : "Components and bugs"}>
        {browser.groups.map((group) => <DefectBranch key={group.component} group={group}
          branch={Object.prototype.hasOwnProperty.call(browser.branches, group.component) ? browser.branches[group.component] : undefined}
          expanded={expanded.includes(group.component)}
          workspaceId={workspaceId} selectedDefectId={selectedDefectId} onSelectDefect={onSelectDefect}
          onToggle={() => toggle(group.component)} onLoadMore={() => browser.loadMoreComponent(group.component)}
          onRetry={() => browser.retryComponent(group.component)} />)}
      </ul>
      {loading && <div className={styles.skeleton} role="status" aria-label={locale === "ru" ? "Загрузка разделов" : "Loading sections"}>
        <span /><span /><span /><span />
      </div>}
      {browser.groupsStatus === "error" && <div className={styles.message} role="alert">
        <strong>{locale === "ru" ? "Не удалось загрузить баг-репорты" : "Could not load bug reports"}</strong>
        <button type="button" onClick={browser.retryGroups}>{retryLabel}</button>
      </div>}
      {browser.groupsStatus === "ready" && browser.groups.length === 0 && <div className={styles.empty}>
        <Bug size={28} /><strong>{t("reports.empty")}</strong><span>{query.trim() ? t("reports.emptySearch") : t("reports.emptyHint")}</span>
      </div>}
      {!loading && browser.hasMoreGroups && <div className={styles.message}>
        <button type="button" onClick={browser.loadMoreGroups}>{locale === "ru" ? "Показать ещё разделы" : "Show more sections"}</button>
      </div>}
    </div>
  </section>;
}

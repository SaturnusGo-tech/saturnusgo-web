import { ArrowDownWideNarrow, ArrowUpWideNarrow, Bug, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { useDefectBrowser } from "../../../defects/browser/state/useDefectBrowser";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useNavigationValue } from "../../../state/navigation/context/useNavigationValue";
import { isClosedDefect, matchesDefectScope, normalizeDefectScope, type DefectBrowserScope } from "../../../defects/browser/model/defect-browser";
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
  const [savedScope, setScope] = useNavigationValue<DefectBrowserScope>(`reports:${workspaceId}:${projectId}:scope`, "active");
  const scope = normalizeDefectScope(savedScope);
  const browser = useDefectBrowser({ workspaceId, projectId, connected, query, defects, severitySort, selectedDefectId, scope });
  const [expanded, setExpanded] = useState<string[]>([]);
  useEffect(() => { setExpanded([]); }, [query, projectId, scope]);
  useEffect(() => {
    if (!browser.groups.length) return;
    setExpanded((current) => current.some((component) => browser.groups.some((group) => group.component === component))
      ? current : [browser.groups[0].component]);
  }, [browser.groups]);
  useEffect(() => { expanded.forEach(browser.openComponent); }, [expanded, browser.openComponent, browser.groups]);
  const loading = browser.groupsStatus === "loading" || browser.groupsStatus === "idle";
  const sortLabel = locale === "ru" ? "Сортировать по серьёзности" : "Sort by severity";
  const retryLabel = locale === "ru" ? "Повторить" : "Retry";
  const scopes: { value: DefectBrowserScope; label: string }[] = [
    { value: "active", label: locale === "ru" ? "Активные" : "Active" },
    { value: "closed", label: locale === "ru" ? "Закрытые" : "Closed" },
    { value: "all", label: locale === "ru" ? "Все" : "All" },
  ];
  const selected = defects.find((defect) => defect.id === selectedDefectId);
  const outsideScope = selected && !matchesDefectScope(selected.status, scope);
  const emptyTitle = query.trim() ? (locale === "ru" ? "Баг-репорты не найдены" : "No matching bug reports")
    : scope === "active" ? (locale === "ru" ? "Нет активных баг-репортов" : "No active bug reports")
    : scope === "closed" ? (locale === "ru" ? "Нет закрытых баг-репортов" : "No closed bug reports") : t("reports.empty");
  const emptyHint = query.trim() ? (scope === "all" ? (locale === "ru" ? "Попробуйте другой ключ, название или компонент." : "Try another key, title or component.")
    : (locale === "ru" ? "Измените запрос или выберите «Все», чтобы искать во всех статусах."
      : "Change the search or select All to search every status."))
    : scope === "active" ? (locale === "ru" ? "Проверенные и закрытые баги сохранены во вкладке «Закрытые»."
      : "Verified and closed bugs are kept in Closed.")
    : scope === "closed" ? (locale === "ru" ? "Здесь будут проверенные и закрытые баги с историей и результатами проверки."
      : "Verified and closed bugs will appear here with their history and verification results.") : t("reports.emptyHint");
  function toggle(component: string) {
    setExpanded((current) => current.includes(component) ? current.filter((value) => value !== component) : [...current, component]);
  }
  return <section className={styles.pane} aria-label={t("reports.title")}>
    <header className={styles.header}>
      <h1>{locale === "ru" ? "Баг-репорты" : "Bug reports"}</h1>
      <div className={styles.scopes} role="group" aria-label={locale === "ru" ? "Состояние баг-репортов" : "Bug report state"}>
        {scopes.map((option) => <button key={option.value} type="button" aria-pressed={scope === option.value}
          onClick={() => setScope(option.value)}>{option.label}</button>)}
      </div>
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
      {browser.totals && scope !== "closed" && <span className={styles.metrics}>
        {scope === "all" && <span>{browser.totals.open} {t("reports.openShort")}</span>}
        <span title={locale === "ru" ? "Открытые критические баги" : "Open critical bugs"}>
          {browser.totals.critical} {t("reports.criticalShort")}</span>
      </span>}
    </div>
    {outsideScope && <div className={styles.scopeHint} role="status">
      <span>{isClosedDefect(selected.status)
        ? (locale === "ru" ? "Этот баг-репорт уже проверен или закрыт." : "The displayed bug report is verified or closed.")
        : (locale === "ru" ? "Этот баг-репорт находится среди активных." : "The displayed bug report is active.")}</span>
      <button type="button" onClick={() => setScope(isClosedDefect(selected.status) ? "closed" : "active")}>
        {isClosedDefect(selected.status) ? (locale === "ru" ? "Показать закрытые" : "Show closed")
          : (locale === "ru" ? "Показать активные" : "Show active")}</button>
    </div>}
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
        <Bug size={28} /><strong>{emptyTitle}</strong><span>{emptyHint}</span>
        {query.trim() && scope !== "all" && <button type="button" onClick={() => setScope("all")}>
          {locale === "ru" ? "Искать во всех статусах" : "Search all statuses"}</button>}
        {!query.trim() && scope === "active" && <button type="button" onClick={() => setScope("closed")}>
          {locale === "ru" ? "Посмотреть закрытые" : "View closed"}</button>}
      </div>}
      {!loading && browser.hasMoreGroups && <div className={styles.message}>
        <button type="button" onClick={browser.loadMoreGroups}>{locale === "ru" ? "Показать ещё разделы" : "Show more sections"}</button>
      </div>}
    </div>
  </section>;
}

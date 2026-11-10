import { ErrorToast } from "../../common/error/ErrorToast";
import { Button, Input, Tab, Tabs } from "@heroui/react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Bug, Plus, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { useDefectBrowser } from "../../../defects/browser/state/useDefectBrowser";
import { useDefectExpansion } from "../../../defects/browser/state/expansion/useDefectExpansion";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useNavigationValue } from "../../../state/navigation/context/useNavigationValue";
import { isClosedDefect, matchesDefectScope, normalizeDefectScope, type DefectBrowserScope, type DefectBrowserState } from "../../../defects/browser/model/defect-browser";
import { usePageAppearance } from "../../workspace/motion/usePageAppearance";
import { FalconTooltip } from "../../common/tooltip/FalconTooltip";
import { DefectBranch } from "../branches/DefectBranch";
import styles from "./defect-browser.module.css";

type QueueSnapshot = { scope: DefectBrowserScope; data: DefectBrowserState; collapsed: string[] };

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
  const { collapsed, toggle } = useDefectExpansion(JSON.stringify([workspaceId, projectId, query, scope]));
  useEffect(() => {
    browser.groups.forEach(group => { if (!collapsed.includes(group.component)) browser.openComponent(group.component); });
  }, [collapsed, browser.openComponent, browser.groups]);
  const loading = browser.groupsStatus === "loading" || browser.groupsStatus === "idle";
  const queueContext = JSON.stringify([workspaceId, projectId, connected, query.trim(), severitySort]);
  const previousQueue = useRef({ context: queueContext, scope, switching: false, ready: null as QueueSnapshot | null });
  const previous = previousQueue.current;
  const sameQueue = previous.context === queueContext;
  const settled = browser.groupsStatus === "ready" && browser.groups.every(({ component }) => {
    const status = browser.branches[component]?.status;
    return collapsed.includes(component) || status === "ready" || status === "error";
  });
  // A scope is ready to show once its initially expanded branches have resolved.
  const switching = sameQueue && (previous.scope !== scope || previous.switching) && !settled && browser.groupsStatus !== "error";
  const retained = switching ? previous.ready : null;
  useEffect(() => {
    previousQueue.current = { context: queueContext, scope, switching,
      ready: settled ? { scope, data: { ...browser }, collapsed }
        : sameQueue && browser.groupsStatus !== "error" ? previous.ready : null };
  }, [queueContext, scope, switching, settled, browser, collapsed, sameQueue, previous.ready]);

  const shown = retained?.data ?? browser;
  const shownScope = retained?.scope ?? scope;
  const shownCollapsed = retained?.collapsed ?? collapsed;
  const queueRef = usePageAppearance(shownScope, .82);
  const sortLabel = locale === "ru" ? "Сортировать по серьёзности" : "Sort by severity";
  const retryLabel = locale === "ru" ? "Повторить" : "Retry";
  const scopes: { value: DefectBrowserScope; label: string }[] = [
    { value: "active", label: locale === "ru" ? "Активные" : "Active" },
    { value: "closed", label: locale === "ru" ? "Закрытые" : "Closed" },
    { value: "all", label: locale === "ru" ? "Все" : "All" },
  ];
  const selected = defects.find((defect) => defect.id === selectedDefectId);
  const outsideScope = selected && !matchesDefectScope(selected.status, shownScope);
  const emptyTitle = query.trim() ? (locale === "ru" ? "Баг-репорты не найдены" : "No matching bug reports")
    : shownScope === "active" ? (locale === "ru" ? "Нет активных баг-репортов" : "No active bug reports")
    : shownScope === "closed" ? (locale === "ru" ? "Нет закрытых баг-репортов" : "No closed bug reports") : t("reports.empty");
  const emptyHint = query.trim() ? (shownScope === "all" ? (locale === "ru" ? "Попробуйте другой ключ, название или компонент." : "Try another key, title or component.")
    : (locale === "ru" ? "Измените запрос или выберите «Все», чтобы искать во всех статусах."
      : "Change the search or select All to search every status."))
    : shownScope === "active" ? (locale === "ru" ? "Проверенные и закрытые баги сохранены во вкладке «Закрытые»."
      : "Verified and closed bugs are kept in Closed.")
    : shownScope === "closed" ? (locale === "ru" ? "Здесь будут проверенные и закрытые баги с историей и результатами проверки."
      : "Verified and closed bugs will appear here with their history and verification results.") : t("reports.emptyHint");
  return <section className={styles.pane} aria-label={t("reports.title")}>
    <header className={styles.header}>
      <h1>{locale === "ru" ? "Баг-репорты" : "Bug reports"}</h1>
      <Tabs aria-label={locale === "ru" ? "Состояние баг-репортов" : "Bug report state"}
        selectedKey={scope} onSelectionChange={key => setScope(normalizeDefectScope(key))}
        classNames={{ tabList: styles.scopes, tab: styles.scopeTab, cursor: styles.scopeCursor, tabContent: styles.scopeLabel }}>
        {scopes.map(option => <Tab key={option.value} title={option.label} />)}
      </Tabs>
    </header>
    <div className={styles.toolbar}>
      <div className={styles.search} data-input-shell>
        <Input size="sm" radius="full" variant="flat" value={query} onValueChange={onQueryChange} maxLength={200}
          placeholder={locale === "ru" ? "Найти баг-репорт" : "Find a bug report"}
          aria-label={t("reports.searchPlaceholder")} startContent={<Search size={15} aria-hidden="true" />}
          classNames={{ inputWrapper: styles.searchShell, innerWrapper: styles.searchInner, input: styles.searchInput }} />
      </div>
      <button type="button" className={styles.sort} aria-label={sortLabel} title={sortLabel}
        aria-pressed={Boolean(severitySort)} data-direction={severitySort ?? undefined}
        onClick={() => onSeveritySortChange(severitySort === "desc" ? "asc" : severitySort === "asc" ? null : "desc")}>
        {severitySort === "asc" ? <ArrowUpWideNarrow size={18} /> : <ArrowDownWideNarrow size={18} />}
      </button>
      <FalconTooltip label={t("reports.newBug")}>
        <Button type="button" size="sm" isIconOnly radius="full" disableRipple className={styles.newButton}
          aria-label={t("reports.newBug")} onPress={onNew}><Plus size={16} aria-hidden="true" /></Button>
      </FalconTooltip>
    </div>
    <div className={styles.summary}>
      <strong>{projectName || (locale === "ru" ? "Проект" : "Project")}</strong>
      {shown.totals && <span className={styles.total}>{shown.totals.total}</span>}
      {shown.totals && shownScope !== "closed" && <span className={styles.metrics}>
        {shownScope === "all" && <span>{shown.totals.open} {t("reports.openShort")}</span>}
        <span title={locale === "ru" ? "Открытые критические баги" : "Open critical bugs"}>
          {shown.totals.critical} {t("reports.criticalShort")}</span>
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
    <div className={styles.viewport} aria-busy={loading || Boolean(retained)}>
      <div ref={element => {
        queueRef.current = element;
        if (element) element.inert = Boolean(retained);
      }}>
        <ul className={styles.groups} aria-label={locale === "ru" ? "Компоненты и баги" : "Components and bugs"}>
          {shown.groups.map((group) => <DefectBranch key={`${shownScope}:${group.component}`} group={group}
            branch={Object.prototype.hasOwnProperty.call(shown.branches, group.component) ? shown.branches[group.component] : undefined}
            expanded={!shownCollapsed.includes(group.component)}
            workspaceId={workspaceId} selectedDefectId={selectedDefectId} onSelectDefect={onSelectDefect}
            onToggle={() => toggle(group.component)} onLoadMore={() => browser.loadMoreComponent(group.component)}
            onRetry={() => browser.retryComponent(group.component)} />)}
        </ul>
        {loading && !retained && shown.groups.length === 0 && <div className={styles.skeleton} role="status" aria-label={locale === "ru" ? "Загрузка разделов" : "Loading sections"}>
          <span /><span /><span /><span />
        </div>}
        <ErrorToast message={shown.groupsStatus === "error" ? (locale === "ru" ? "Не удалось загрузить баг-репорты" : "Could not load bug reports") : null}
          retryLabel={retryLabel} onRetry={browser.retryGroups} />
        {shown.groupsStatus === "ready" && shown.groups.length === 0 && <div className={styles.empty}>
          <Bug size={28} /><strong>{emptyTitle}</strong><span>{emptyHint}</span>
          {query.trim() && shownScope !== "all" && <button type="button" onClick={() => setScope("all")}>
            {locale === "ru" ? "Искать во всех статусах" : "Search all statuses"}</button>}
          {!query.trim() && shownScope === "active" && <button type="button" onClick={() => setScope("closed")}>
            {locale === "ru" ? "Посмотреть закрытые" : "View closed"}</button>}
        </div>}
        {(!loading || retained) && shown.hasMoreGroups && <div className={styles.message}>
          <button type="button" onClick={browser.loadMoreGroups}>{locale === "ru" ? "Показать ещё разделы" : "Show more sections"}</button>
        </div>}
      </div>
    </div>
  </section>;
}
